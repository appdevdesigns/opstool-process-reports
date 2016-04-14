/**
 * DocxTemplateController
 *
 * @description :: Server-side logic for managing Userteams
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var AD = require('ad-utils'),
	async = require('async'),
	_ = require('lodash'),
	moment = require('moment'),
	fs = require('fs'),
	DocxGen = require('docxtemplater'),
	DocxImageModule = require('docxtemplater-image-module'),
	sizeOf = require('image-size'),
	renderReportController = require('fcf_activities/api/controllers/RenderReportController.js');

function changeThaiFormat(momentDate) {
	return momentDate.add(543, 'years').locale('th').format('D MMMM YYYY');
}

module.exports = {
	// /opstool-process-reports/docxtemplate/activities
	activities: function(req, res) {
		AD.log('<green>::: docxtemplate.activities() :::</green>');

		var data = { staffs: null };
		var activities;
		var resultBuffer;

		var staffName = req.param('Member name');
		var startDate = req.param('Start date');
		var endDate = req.param('End date');

		async.series([

			// Get data
			function(next) {
				async.parallel([
					// Get staffs data
					function(callback) {
						var temp_res = {
							send: function(result, code) {
								var r = JSON.parse(result);
								if (r.status === 'success') {
									data.staffs = r.data;
								}

								callback();
							}
						};

						renderReportController.staffs(req, temp_res);
					},
					// Get activity images data
					function(callback) {
						var temp_res = {
							send: function(result, code) {
								var r = JSON.parse(result);
								if (r.status === 'success')
									activities = r.data;

								callback();
							}
						};

						renderReportController.activities(req, temp_res);
					}
				], function(err) {
					next(err);
				});
			},

			// Convert data to support docx template
			function(next) {
				// Staffs filter
				if (staffName) {
					_.remove(data.staffs, function(s) {
						return s.person_name.indexOf(staffName) < 1;
					});
				}

				// Activities start date filter
				if (startDate) {
					var startDateObj = moment(startDate, 'M/D/YY', 'en');
					_.remove(activities, function(a) {
						var actStartDateObj = moment(a.startDate);

						if (!a.startDate || actStartDateObj < startDateObj)
							return true;
						else
							return false;
					});

					if (startDateObj.isValid())
						data.startDate = changeThaiFormat(startDateObj)
				}

				// Activities end date filter
				if (endDate) {
					var endDateObj = moment(endDate, 'M/D/YY', 'en');
					_.remove(activities, function(a) {
						var actEndDateObj = moment(a.endDate);

						if (!a.endDate || (actEndDateObj.isValid() && actEndDateObj > endDateObj))
							return true;
						else
							return false;
					});

					if (endDateObj.isValid())
						data.endDate = changeThaiFormat(endDateObj)
				}

				data.staffs.forEach(function(s) {
					s.activities = _.filter(activities, function(a) {
						// Convert date time to Thai format
						var visaStartDate = moment(s.person_visa_start_date, 'DD MMMM YYYY', 'en');
						if (visaStartDate.isValid())
							s.person_visa_start_date = changeThaiFormat(visaStartDate);

						var visaExpireDate = moment(s.person_visa_expire_date, 'DD MMMM YYYY', 'en');
						if (visaExpireDate.isValid())
							s.person_visa_expire_date = changeThaiFormat(visaExpireDate);

						return s.person_id == a.person_id;
					});
				});

				_.remove(data.staffs, function(s) {
					return typeof s.activities === 'undefined' || !s.activities || s.activities.length < 1;
				});

				next();
			},

			// Generate docx file
			function(next) {

				// TODO : Get file binary from database
				fs.readFile(__dirname + "/../../docx templates/activities template.docx", "binary", function(err, content) {
					var docx = new DocxGen()
						.load(content)
						.setData(data).render();

					resultBuffer = docx.getZip().generate({ type: "nodebuffer" });

					next();
				});
			}

		], function(err, r) {

			if (err) {

				ADCore.comm.error(res, err, 500);
			} else {

				AD.log('<green>::: end docxtemplate.activities() :::</green>');

				var buff = new Buffer(resultBuffer, 'binary');

				res.set({
					"Content-Disposition": 'attachment; filename="' + 'activities.docx' + '"',
					"Content-Type": 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
					"Content-Length": buff.length
				});

				res.send(buff);
			}
		});
	},

	// /opstool-process-reports/docxtemplate/acitivity_images
	acitivity_images: function(req, res) {
		AD.log('<green>::: docxtemplate.acitivity_images() :::</green>');

		var data = { staffs: null };
		var activity_images;
		var resultBuffer;

		var staffName = req.param('Member name');
		var startDate = req.param('Start date');
		var endDate = req.param('End date');

		async.series([

			// Get data
			function(next) {
				async.parallel([
					// Get staffs data
					function(callback) {
						var temp_res = {
							send: function(result, code) {
								var r = JSON.parse(result);
								if (r.status === 'success') {
									data.staffs = r.data;

									// For TEST: reduce number staffs
									data.staffs = data.staffs.slice(0, 5);
								}

								callback();
							}
						};

						renderReportController.staffs(req, temp_res);
					},
					// Get activity images data
					function(callback) {
						var temp_res = {
							send: function(result, code) {
								var r = JSON.parse(result);
								if (r.status === 'success')
									activity_images = r.data;

								callback();
							}
						};

						renderReportController.acitivity_images(req, temp_res);
					}
				], function(err) {
					next(err);
				});
			},

			// Convert data to support docx template
			function(next) {
				// Staffs filter
				if (staffName) {
					data.staffs = _.filter(data.staffs, function(s) {
						return s.person_name.indexOf(staffName) > -1 || s.person_name_en.indexOf(staffName) > -1;
					});
				}

				// Activities start date filter
				if (startDate) {
					var startDateObj = moment(startDate, 'M/D/YY', 'en');
					_.remove(activity_images, function(a) {
						var actStartDateObj = moment(a.activity_start_date);

						if (!a.activity_start_date || actStartDateObj < startDateObj)
							return true;
						else
							return false;
					});

					if (startDateObj.isValid())
						data.startDate = changeThaiFormat(startDateObj)
				}

				// Activities end date filter
				if (endDate) {
					var endDateObj = moment(endDate, 'M/D/YY', 'en');
					_.remove(activity_images, function(a) {
						var actEndDateObj = moment(a.acitivity_end_date);

						if (!a.acitivity_end_date || (actEndDateObj.isValid() && actEndDateObj > endDateObj))
							return true;
						else
							return false;
					});

					if (endDateObj.isValid())
						data.endDate = changeThaiFormat(endDateObj)
				}

				// Delete null value properties
				activity_images.forEach(function(img, index) {
					if (!img.activity_image_file_name_right_column || img.activity_image_file_name_right_column === 'blank.jpg')
						delete img['activity_image_file_name_right_column'];

					if (!img.activity_image_caption_left_column)
						img.activity_image_caption_left_column = '';

					if (!img.activity_image_caption_right_column)
						img.activity_image_caption_right_column = '';

					if (!img.activity_image_caption_govt_left_column)
						img.activity_image_caption_govt_left_column = '';

					if (!img.activity_image_caption_govt_right_column)
						img.activity_image_caption_govt_right_column = '';
				});

				data.staffs.forEach(function(s, index) {
					var activities = _.filter(activity_images, function(img) {
						return img.person_id == s.person_id;
					});

					// Group activities
					var groupedActivities = _.groupBy(activities, 'activity_id');

					var image_row_number = 0;
					s.activities = _.transform(groupedActivities, function(result, current) {
						var r = {};

						// Show page header
						if (image_row_number === 1 || (image_row_number - 1) % 2 === 0)
							r.activity_has_header = true;

						r.activity_name = current[0].activity_name;
						r.activity_description = current[0].activity_description;
						r.activity_name_govt = current[0].activity_name_govt;
						r.activity_description_govt = current[0].activity_description_govt;
						r.images = _.map(current, function(img) {
							var image = {};

							if (img.activity_image_file_name_left_column)
								image.activity_image_file_name_left_column = img.activity_image_file_name_left_column;

							if (img.activity_image_file_name_right_column)
								image.activity_image_file_name_right_column = img.activity_image_file_name_right_column;

							if (img.activity_image_caption_left_column)
								image.activity_image_caption_left_column = img.activity_image_caption_left_column;
							else
								image.activity_image_caption_left_column = '';

							if (img.activity_image_caption_right_column)
								image.activity_image_caption_right_column = img.activity_image_caption_right_column;
							else
								image.activity_image_caption_right_column = '';

							if (img.activity_image_caption_govt_left_column)
								image.activity_image_caption_govt_left_column = img.activity_image_caption_govt_left_column;
							else
								image.activity_image_caption_govt_left_column = '';

							if (img.activity_image_caption_govt_right_column)
								image.activity_image_caption_govt_right_column = img.activity_image_caption_govt_right_column;
							else
								image.activity_image_caption_govt_right_column = '';

							// Show page header
							if (!r.activity_has_header && (image_row_number === 1 || (image_row_number - 1) % 2 === 0))
								image.has_header = true;

							image_row_number++;

							return image;
						});

						result.push(r);

					}, []);

				});

				// Remove staffs who don't have any activities
				_.remove(data.staffs, function(s) {
					return typeof s.activities === 'undefined' || !s.activities || s.activities.length < 1;
				});

				data.activity_image_file_name_left_column = ""; // Ignore bug in docxtemplater-image-module v.1.0.0 unstable
				data.activity_image_file_name_right_column = ""; // Ignore bug in docxtemplater-image-module v.1.0.0 unstable

				next();
			},

			// Generate docx file
			function(next) {

				var imageModule = new DocxImageModule({
					centered: false,
					getImage: function(tagValue, tagName) {
						try {
							if ((tagName === 'activity_image_file_name_left_column' || tagName === 'activity_image_file_name_right_column') && tagValue) {
								// Get image binary
								var imgContent = fs.readFileSync(__dirname + '/../../../../assets/data/fcf/images/activities/' + tagValue);
								return imgContent;
							}
						}
						catch (err) {
							console.log('err: ', err);
						}
					},
					getSize: function(imgBuffer, tagValue, tagName) {
						if (imgBuffer) {
							var maxWidth = 300;
							var maxHeight = 160;

							// Find aspect ratio image dimensions
							var image = sizeOf(imgBuffer);
							var ratio = Math.min(maxWidth / image.width, maxHeight / image.height);

							return [image.width * ratio, image.height * ratio];
						}
						else {
							return [0, 0];
						}
					}
				});

				// TODO : Get file binary from database
				fs.readFile(__dirname + "/../../docx templates/activity images template.docx", "binary", function(err, content) {
					var docx = new DocxGen()
						.attachModule(imageModule)
						.load(content)
						.setData(data).render();

					resultBuffer = docx.getZip().generate({ type: "nodebuffer" });

					next();
				});
			}
		], function(err, r) {

			if (err) {

				ADCore.comm.error(res, err, 500);
			} else {

				AD.log('<green>::: end docxtemplate.acitivity_images() :::</green>');

				var buff = new Buffer(resultBuffer, 'binary');

				res.set({
					"Content-Disposition": 'attachment; filename="' + 'activity images.docx' + '"',
					"Content-Type": 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
					"Content-Length": buff.length
				});

				res.send(buff);

			}
		});
	}
};