/**
 * Render documents with Docx.
 *
 * This script is intended to be executed as a forked process. It communicates
 * with the parent process through IPC messages.
 */

var DocxGen = require('docxtemplater');
var DocxImageModule = require('docxtemplater-image-module');
var sizeOf = require('image-size');
var fs = require('fs');
var path = require('path');
var async = require('async');

// process.send() should only be available if this file was executed with child_process.fork()
if (process.send) {
	/**
	 * @param {object} msg
	 * @param {string} msg.templateFile
	 *		The full path of the Docx template file.
	 * @param {object} msg.data
	 *		The data to be used for populating the template.
	 *
	 * @param {object} [msg.image]
	 * @param {string} [msg.image.path]
	 *		The full path to the image files.
	 * @param {integer} [msg.image.maxWidth]
	 * @param {integer} [msg.image.maxHeight]
	 * @param {array} [msg.image.tagNames]
	 *		Use images with these tagNames.
	 *		Array of strings.
	 */
	process.on('message', (msg) => {
		if (msg && msg.data && msg.templateFile) {
			var output = null;
			var docx = new DocxGen();
			
			async.series([
				
				// Prepare image plugin (optional)
				(next) => {
					if (msg.image) {
						var imageModule = new DocxImageModule({
							centered: false,
							getImage: (tagValue, tagName) => {
								try {
									// Only use images with a matching tagName
									var nameMatch = true;
									if (msg.image.tagNames && msg.image.tagNames.indexOf(tagName) < 0) {
										nameMatch = false;
									}
									if (tagValue && nameMatch) {
										var imgContent = fs.readFileSync(
											path.join(msg.image.path, tagValue)
										);
										return imgContent;
									}
								}
								catch (err) {
									console.error(err);
								}
							},
							getSize: (imgBuffer, tagValue, tagName) => {
								if (imgBuffer) {
									// Find apsect ratio image dimensions
									var image = sizeOf(imgBuffer);
									var ratio = Math.min(msg.image.maxWidth / image.width, msg.maxHeight / image.height);
									
									return [image.width * ratio, image.height * ratio];
								}
								else {
									return [0, 0];
								}
							}
						});
						docx.attachModule(imageModule);
					}
					next();
				},
				
				// Read template file
				(next) => {
					fs.readFile(msg.templateFile, 'binary', (err, templateContent) => {
						if (err) next(err);
						else {
							docx.load(templateContent);
							next();
						}
					});
				},
				
				// Render doc
				(next) => {
					docx.setData(msg.data).render();
					output = docx.getZip().generate({ type: 'nodebuffer' });
					next();
				},
			
			], (err) => {
				// Send results back to parent process
				if (err) process.send({ 'error': err });
				else process.send(output);
			});
		}
	});
}
