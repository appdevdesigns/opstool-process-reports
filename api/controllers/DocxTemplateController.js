/**
 * DocxTemplateController
 *
 * @description :: Server-side logic for managing Userteams
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var AD = require('ad-utils'),
	async = require('async'),
	_ = require('lodash'),
	fs = require('fs'),
	DocxGen = require('docxtemplater'),
	DocxImageModule = require('docxtemplater-image-module'),
	sizeOf = require('image-size'),
	renderReportController = require('fcf_activities/api/controllers/RenderReportController.js');

module.exports = {
	// /opstool-process-reports/docxtemplate/activities
	activities: function(req, res) {
		AD.log('<green>::: docxtemplate.activities() :::</green>');
	},

	// /opstool-process-reports/docxtemplate/acitivity_images
	acitivity_images: function(req, res) {
		AD.log('<green>::: docxtemplate.acitivity_images() :::</green>');

		var _this = this;
		var staffs = { staffs: null };
		var activity_images;
		var resultBuffer;

		async.series([

			// Get staffs data
			function(next) {
				var temp_res = {
					send: function(result, code) {
						var r = JSON.parse(result);
						if (r.status === 'success') {
							staffs.staffs = r.data;

							// For TEST: reduce number staffs
							staffs.staffs = staffs.staffs.slice(0, 5);
						}

						next();
					}
				};

				renderReportController.staffs(req, temp_res);
			},

			// Get activity images data
			function(next) {
				var temp_res = {
					send: function(result, code) {
						var r = JSON.parse(result);
						if (r.status === 'success')
							activity_images = r.data;

						next();
					}
				};

				renderReportController.acitivity_images(req, temp_res);
			},

			// Convert data to support docx template
			function(next) {
				// Delete null value properties
				activity_images.forEach(function(img, index) {
					if (!img.activity_image_file_name_right_column || img.activity_image_file_name_right_column === 'blank.jpg')
						delete img['activity_image_file_name_right_column'];

					if (!img.activity_image_caption_left_column)
						img.activity_image_caption_left_column = '';

					if (!img.activity_image_caption_right_column)
						img.activity_image_caption_right_column = '';
				});

				staffs.staffs.forEach(function(s, index) {
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
				_.remove(staffs.staffs, function(s) {
					return typeof s.activities === 'undefined' || !s.activities || s.activities.length < 1;
				});

				staffs.activity_image_file_name_left_column = ""; // Ignore bug in docxtemplater-image-module v.1.0.0 unstable
				staffs.activity_image_file_name_right_column = ""; // Ignore bug in docxtemplater-image-module v.1.0.0 unstable

				next();
			},

			// Generate doc file
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
				fs.readFile(__dirname + "/../../docx templates/activity images.docx", "binary", function(err, content) {
					var docx = new DocxGen()
						.attachModule(imageModule)
						.load(content)
						.setData(staffs).render();

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