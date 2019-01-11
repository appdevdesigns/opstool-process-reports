/**
 * Render documents with Docx.
 *
 * This script is intended to be executed as a forked process. It communicates
 * with the parent process through IPC messages.
 */

// process.send() should only be available if this file was executed 
// with child_process.fork(). If not, then this file was added with require().

// For require()
if (!process.send) {
	var child_process = require('child_process');
	
	// Start the Docx worker child process. This will be reused for every 
	// rendering job.
	var workerProcess = child_process.fork(__dirname + '/DocxWorker.js');
	if (!workerProcess) {
		console.error('Unable to launch DocxWorker.js');
	}
	var workerJobCount = 0;
	process.on('exit', () => {
		workerProcess && workerProcess.kill();
	});
	
	/**
	 * Perform Docx rendering in a separate thread.
	 *
	 * @param {object} options
	 * @param {string} options.templateFile
	 *		The full path of the Docx template file.
	 * @param {object} options.data
	 *		The data to be used for populating the template.
	 *
	 * @param {object} [options.image]
	 * @param {string} [options.image.path]
	 *		The full path to the image files.
	 * @param {integer} [options.image.maxWidth]
	 * @param {integer} [options.image.maxHeight]
	 * @param {array} [options.image.tagNames]
	 *		Use images with these tagNames.
	 *		Array of strings.
	 *
	 * @return {Promise}
	 */
	module.exports = function docxWorker(options) {
		return new Promise((resolve, reject) => {
			if (!workerProcess) {
				reject(new Error('DocxWorker process not available'));
			}
			else {
				// Each job has a unique ID
				options.jobID = workerJobCount;
				workerJobCount += 1;
				
				workerProcess.send(options);
				var messageHandler = function(msg) {
					if (msg.jobID == options.jobID) {
						workerProcess.removeListener('message', messageHandler);
						if (msg.error) {
							reject(msg.error);
						}
						else {
							resolve(msg.result);
						}
					}
				};
				workerProcess.on('message', messageHandler);
			}
		});
	};
}


// For fork()
else {
	var DocxGen = require('docxtemplater');
	var DocxImageModule = require('docxtemplater-image-module');
	var sizeOf = require('image-size');
	var fs = require('fs');
	var path = require('path');
	var async = require('async');
	
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
				if (err) {
					process.send({
						jobID: msg.jobID,
						error: err,
					});
				}
				else {
					process.send({
						jobID: msg.jobID,
						result: output,
					});
				}
			});
		}
	});
}