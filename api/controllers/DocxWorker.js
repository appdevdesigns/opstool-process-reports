/**
 * Render documents with Docx in a separate thread.
 *
 * Communication with the thread is done through IPC messages.
 */

// process.send() should only be available if this file was executed 
// with child_process.fork(). If not, then this file was added with require().

// For require()
// This is the parent process.
if (!process.send) {
	var child_process = require('child_process');
	
	// Start the Docx worker child process. This will be reused for every 
	// rendering job.
	var workerProcess = child_process.fork(__filename);
	if (!workerProcess) {
		var err = new Error('Unable to launch DocxWorker.js');
		console.error(err);
		// throw err;
	}
	process.on('exit', () => {
		workerProcess && workerProcess.kill();
	});
	
	// Used to assign worker jobID values
	var workerJobCount = 0;
	
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
	 * @param {boolean} [options.image.centered]
	 *		Default is false.
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
				if (workerJobCount >= Number.MAX_SAFE_INTEGER) {
					// Wrap around to 0
					workerJobCount = 0;
				}
				
				// Send job to worker process
				workerProcess.send(options);
				
				// Receive results from worker process
				var messageHandler = function(msg) {
					if (msg.jobID == options.jobID) {
						// Clean up
						workerProcess.removeListener('message', messageHandler);
						// Deliver
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
// This is the worker process.
else {
	var DocxGen = require('docxtemplater');
	var DocxImageModule = require('docxtemplater-image-module');
	var sizeOf = require('image-size');
	var fs = require('fs');
	var path = require('path');
	var async = require('async');
	
	// Receive job from parent process
	process.on('message', (msg) => {
		var output = null;
		var docx = new DocxGen();
		
		async.series([
			
			// Preliminary checks
			(next) => {
				if (!msg || !msg.data || !msg.templateFile) {
					next(new TypeError('Incorrect parameters given for docxWorker'));
				}
				else {
					next();
				}
			},
			
			// Prepare image plugin (optional)
			(next) => {
				if (msg.image) {
					var imageModule = new DocxImageModule({
						centered: msg.image.centered || false,
						getImage: (tagValue, tagName) => {
							var imageFilename = path.join(msg.image.path, tagValue);
							try {
								// Only use images with a matching tagName
								var nameMatch = true;
								if (msg.image.tagNames && msg.image.tagNames.indexOf(tagName) < 0) {
									nameMatch = false;
								}
								if (tagValue && nameMatch) {
									var imgContent = fs.readFileSync(imageFilename);
									return imgContent;
								}
							}
							catch (err) {
								if (err.code == 'ENOENT') {
									console.error("DocxGen can't read image file: " + imageFilename);
								}
								else console.error(err);
							}
						},
						getSize: (imgBuffer, tagValue, tagName) => {
							if (imgBuffer) {
								// Find apsect ratio image dimensions
								var image = sizeOf(imgBuffer);
								var ratio = Math.min(msg.image.maxWidth / image.width, msg.image.maxHeight / image.height);
								
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
				console.error('DocxWorker error:', err);
				process.send({
					jobID: msg.jobID,
					// Error() objects won't pass through IPC
					error: err.message || err
				});
			}
			else {
				process.send({
					jobID: msg.jobID,
					result: output,
				});
			}
		});
	});
}
