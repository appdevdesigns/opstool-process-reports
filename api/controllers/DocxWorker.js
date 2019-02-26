/**
 * Render documents with Docx in a separate thread, then save result to a
 * temporary file.
 *
 * Communication with the thread is done through IPC messages.
 */

// process.send() should only be available if this file was executed 
// with child_process.fork(). If not, then this file was added with require(),
// which means we are in the parent process.

// This is the parent process.
if (!process.send) {
	var child_process = require('child_process');
	var isTimeToDie = false;
	var numLivesRemaining = 50;
	var workerProcess;
	
	var launchWorker = function() {
		// Start the Docx worker process. This will be reused for all 
		// rendering jobs.
		workerProcess = child_process.fork(__filename, [], { execArgv: [] });
		if (!workerProcess) {
			var err = new Error('Unable to launch DocxWorker.js');
			console.error(err);
			// throw err;
		}
		// Re-launch worker process if it dies unexpectedly
		workerProcess.on('exit', (code) => {
			if (!isTimeToDie) {
				if (numLivesRemaining > 0) {
					console.log(`DocxWorker died [${code}]. Relaunching.`);
					numLivesRemaining -= 1;
					launchWorker();
				}
				else {
					console.log('DocxWorker died too many times.');
				}
			}
		});
	};
	launchWorker();
	
	// Kill worker process when parent exits.
	process.on('exit', () => {
		if (workerProcess && workerProcess.connected) {
			isTimeToDie = true;
			workerProcess.kill();
		}
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
	 *		{ 
	 *			"name": <full path to rendered file>,
	 *			"length": <size of rendered file>
	 *		}
	 */
	module.exports = function docxWorker(options) {
		return new Promise((resolve, reject) => {
			if (!workerProcess || !workerProcess.connected) {
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
							resolve(msg.tempFile);
						}
					}
				};
				workerProcess.on('message', messageHandler);
			}
		});
	};
}


// This is the worker process.
else {
	var DocxGen = require('docxtemplater');
	var DocxImageModule = require('docxtemplater-image-module');
	var sizeOf = require('image-size');
	var fs = require('fs');
	var path = require('path');
	var async = require('async');
	var uuid = require('uuid/v1');
	var os = require('os');
	
	process.title = 'DocxWorker.js';
	
	// Receive job from parent process
	process.on('message', (msg) => {
		var docx = new DocxGen();
		var tempFileName = path.join(os.tmpDir(), 'docx-' + uuid());
		var tempFileLength;
		
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
							if (imgBuffer && (imgBuffer.length > 0)) {
								// Find aspect ratio image dimensions
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
			
			// Render doc and save to disk
			(next) => {
				docx.setData(msg.data).render();
				var output = docx.getZip().generate({ type: 'nodebuffer' });
				tempFileLength = output.length;
				fs.writeFile(tempFileName, output, (err) => {
					if (err) next(err);
					else next();
				});
			},
		
		], (err) => {
			// Send results back to parent process
			if (err) {
				console.error('DocxWorker error:', err);
				process.send({
					jobID: msg.jobID,
					// Error() objects can't be serialized through IPC
					error: err.message || err
				});
			}
			else {
				process.send({
					jobID: msg.jobID,
					tempFile: {
						name: tempFileName,
						length: tempFileLength
					}
				});
			}
		});
	});
}
