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
	exif = require('exif-parser'),
	jpegjs = require('jpeg-js'),
	renderReportController = require('fcf_activities/api/controllers/RenderReportController.js');

var changeThaiFormat = function (momentDate, format) {
	if (!format)
		format = 'D MMMM YYYY';

	return momentDate.add(543, 'years').locale('th').format(format);
}

var _autoOrient = function (buffer) {
	// Get Exif info
	var exifMetaData = exif.create(buffer).parse();

	if (exifMetaData.tags.Orientation === 1 || typeof exifMetaData.tags.Orientation === 'undefined')
		return buffer;

	try {
		var jpeg = jpegjs.decode(buffer);
	}
	catch (error) {
		return;
	}
	var new_buffer = jpeg.data;

	var transformations = {
		2: { rotate: 0, flip: true },
		3: { rotate: 180, flip: false },
		4: { rotate: 180, flip: true },
		5: { rotate: 90, flip: true },
		6: { rotate: 90, flip: false },
		7: { rotate: 270, flip: true },
		8: { rotate: 270, flip: false }
	};

	var orientation = exifMetaData.tags.Orientation;
	if (transformations[orientation].rotate > 0) {
		new_buffer = _rotate(new_buffer, jpeg.width, jpeg.height, transformations[orientation].rotate);
	}
	if (transformations[orientation].flip) {
		new_buffer = _flip(new_buffer, jpeg.width, jpeg.height);
	}
	var width = orientation < 5 ? jpeg.width : jpeg.height;
	var height = orientation < 5 ? jpeg.height : jpeg.width;
	var quality = 80;

	var new_jpeg = jpegjs.encode({ data: new_buffer, width: width, height: height }, quality);

	return new_jpeg.data;
}

/**
 * Rotates a buffer (degrees must be a multiple of 90)
 * @param buffer
 * @param width
 * @param height
 * @param degrees
 */
var _rotate = function (buffer, width, height, degrees) {
    var loops = degrees / 90;
    while (loops > 0) {
        var new_buffer = new Buffer(buffer.length);
        var new_offset = 0;
        for (var x = 0; x < width; x += 1) {
            for (var y = height - 1; y >= 0; y -= 1) {
                var offset = (width * y + x) << 2;
                var pixel = buffer.readUInt32BE(offset, true);
                new_buffer.writeUInt32BE(pixel, new_offset, true);
                new_offset += 4;
            }
        }
        buffer = new_buffer;
        var new_height = width;
        width = height;
        height = new_height;
        loops -= 1;
    }
    return buffer;
};

/**
 * Flips a buffer horizontally
 * @param buffer
 * @param width
 * @param height
 */
var _flip = function (buffer, width, height) {
    var new_buffer = new Buffer(buffer.length);
    for (var x = 0; x < width; x += 1) {
        for (var y = 0; y < height; y += 1) {
            var offset = (width * y + x) << 2;
            var new_offset = (width * y + width - 1 - x) << 2;
            var pixel = buffer.readUInt32BE(offset, true);
            new_buffer.writeUInt32BE(pixel, new_offset, true);
        }
    }
    return new_buffer;
};

module.exports = {
	// /opstool-process-reports/docxtemplate/activities
	activities: function (req, res) {
		AD.log('<green>::: docxtemplate.activities() :::</green>');

		var data = { staffs: null };
		var activities;
		var resultBuffer;

		var staffName = req.param('Member name');
		var startDate = req.param('Start date');
		var endDate = req.param('End date');

		async.series([

			// Get data
			function (next) {
				async.parallel([
					// Get staffs data
					function (callback) {
						var temp_res = {
							send: function (result, code) {
								var r = JSON.parse(result);
								if (r.status === 'success') {
									data.staffs = r.data;

									data.staffs = data.staffs.concat(data.staffs);
								}

								callback();
							}
						};

						renderReportController.staffs(req, temp_res);
					},
					// Get activity images data
					function (callback) {
						var temp_res = {
							send: function (result, code) {
								var r = JSON.parse(result);
								if (r.status === 'success')
									activities = r.data;

								callback();
							}
						};

						renderReportController.activities(req, temp_res);
					}
				], function (err) {
					next(err);
				});
			},

			// Convert data to support docx template
			function (next) {
				// Staffs filter
				if (staffName) {
					_.remove(data.staffs, function (s) {
						return s.person_name.indexOf(staffName) < 1;
					});
				}

				// Activities start date filter
				if (startDate) {
					var startDateObj = moment(startDate, 'M/D/YY', 'en');
					_.remove(activities, function (a) {
						var actStartDateObj = moment(a.startDate);

						if (!a.startDate || actStartDateObj < startDateObj)
							return true;
						else
							return false;
					});

					if (startDateObj.isValid())
						data.startDate = changeThaiFormat(startDateObj, 'MMMM YYYY');
				}

				// Activities end date filter
				if (endDate) {
					var endDateObj = moment(endDate, 'M/D/YY', 'en');
					_.remove(activities, function (a) {
						var actEndDateObj = moment(a.endDate);

						if (!a.endDate || (actEndDateObj.isValid() && actEndDateObj > endDateObj))
							return true;
						else
							return false;
					});

					if (endDateObj.isValid())
						data.endDate = changeThaiFormat(endDateObj, 'MMMM YYYY');
				}

				data.staffs.forEach(function (s) {
					// Convert date time to Thai format
					var visaStartDate = moment(s.person_visa_start_date, 'DD MMMM YYYY', 'en');
					if (visaStartDate.isValid())
						s.person_visa_start_date = changeThaiFormat(visaStartDate);

					var visaExpireDate = moment(s.person_visa_expire_date, 'DD MMMM YYYY', 'en');
					if (visaExpireDate.isValid())
						s.person_visa_expire_date = changeThaiFormat(visaExpireDate);

					s.activities = _.filter(activities, function (a) {
						return s.person_id == a.person_id;
					});

					// Set activities order index
					if (s.activities) {
						s.activities.forEach(function (a, index) {
							a.order = index + 1;
						});
					}
				});

				_.remove(data.staffs, function (s) {
					return typeof s.activities === 'undefined' || !s.activities || s.activities.length < 1;
				});

				next();
			},

			// Generate docx file
			function (next) {

				// TODO : Get file binary from database
				fs.readFile(__dirname + "/../../docx templates/activities template.docx", "binary", function (err, content) {
					var docx = new DocxGen()
						.load(content)
						.setData(data).render();

					resultBuffer = docx.getZip().generate({ type: "nodebuffer" });

					next();
				});
			}

		], function (err, r) {

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
	acitivity_images: function (req, res) {
		AD.log('<green>::: docxtemplate.acitivity_images() :::</green>');

		var data = { staffs: null };
		var activity_images;
		var resultBuffer;

		var staffName = req.param('Member name');
		var startDate = req.param('Start date');
		var endDate = req.param('End date');

		async.series([

			// Get data
			function (next) {
				async.parallel([
					// Get staffs data
					function (callback) {
						var temp_res = {
							send: function (result, code) {
								var r = JSON.parse(result);
								if (r.status === 'success') {
									data.staffs = r.data;

									// For TEST: reduce number staffs
									data.staffs = data.staffs.slice(0, 15);
								}

								callback();
							}
						};

						renderReportController.staffs(req, temp_res);
					},
					// Get activity images data
					function (callback) {
						var temp_res = {
							send: function (result, code) {
								var r = JSON.parse(result);
								if (r.status === 'success')
									activity_images = r.data;

								callback();
							}
						};

						renderReportController.acitivity_images(req, temp_res);
					}
				], function (err) {
					next(err);
				});
			},

			// Convert data to support docx template
			function (next) {
				// Staffs filter
				if (staffName) {
					data.staffs = _.filter(data.staffs, function (s) {
						return s.person_name.indexOf(staffName) > -1 || s.person_name_en.indexOf(staffName) > -1;
					});
				}

				// Activities start date filter
				if (startDate) {
					var startDateObj = moment(startDate, 'M/D/YY', 'en');
					_.remove(activity_images, function (a) {
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
					_.remove(activity_images, function (a) {
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
				activity_images.forEach(function (img, index) {
					if (typeof img.activity_image_file_name_right_column === 'undefined' || img.activity_image_file_name_right_column === null || img.activity_image_file_name_right_column === 'blank.jpg')
						delete img['activity_image_file_name_right_column'];

					if (typeof img.activity_image_caption_left_column === 'undefined' || img.activity_image_caption_left_column === null)
						img.activity_image_caption_left_column = '';

					if (typeof img.activity_image_caption_right_column === 'undefined' || img.activity_image_caption_right_column === null)
						img.activity_image_caption_right_column = '';

					if (typeof img.activity_image_caption_govt_left_column === 'undefined' || img.activity_image_caption_govt_left_column === null)
						img.activity_image_caption_govt_left_column = '';

					if (typeof img.activity_image_caption_govt_right_column === 'undefined' || img.activity_image_caption_govt_right_column === null)
						img.activity_image_caption_govt_right_column = '';
				});

				data.staffs.forEach(function (s, index) {
					var activities = _.filter(activity_images, function (img) {
						return img.person_id == s.person_id;
					});

					// Group activities
					var groupedActivities = _.groupBy(activities, 'activity_id');

					var image_row_number = 0;
					s.activities = _.transform(groupedActivities, function (result, current) {
						var r = {};

						// Show page header
						if (image_row_number === 1 || (image_row_number - 1) % 2 === 0)
							r.activity_has_header = true;

						r.activity_name = current[0].activity_name;
						r.activity_description = current[0].activity_description;
						r.activity_name_govt = current[0].activity_name_govt;
						r.activity_description_govt = current[0].activity_description_govt;
						r.images = _.map(current, function (img) {
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
				_.remove(data.staffs, function (s) {
					return typeof s.activities === 'undefined' || !s.activities || s.activities.length < 1;
				});

				data.activity_image_file_name_left_column = ""; // Ignore bug in docxtemplater-image-module v.1.0.0 unstable
				data.activity_image_file_name_right_column = ""; // Ignore bug in docxtemplater-image-module v.1.0.0 unstable

				next();
			},

			// Generate docx file
			function (next) {

				var imageModule = new DocxImageModule({
					centered: false,
					getImage: function (tagValue, tagName) {
						try {
							if ((tagName === 'activity_image_file_name_left_column' || tagName === 'activity_image_file_name_right_column') && tagValue) {
								// Get image binary
								var imgContent = fs.readFileSync(__dirname + '/../../../../assets/data/fcf/images/activities/' + tagValue);

								// Auto rotate
								var newImgContent = _autoOrient(imgContent);

								return newImgContent;
							}
						}
						catch (err) {
							console.log('err: ', err);
						}
					},
					getSize: function (imgBuffer, tagValue, tagName) {
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
				fs.readFile(__dirname + "/../../docx templates/activity images template.docx", "binary", function (err, content) {
					var docx = new DocxGen()
						.attachModule(imageModule)
						.load(content)
						.setData(data).render();

					resultBuffer = docx.getZip().generate({ type: "nodebuffer" });

					next();
				});
			}
		], function (err, r) {

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