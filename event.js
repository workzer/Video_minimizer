const { execSync, exec } = require("child_process");
const fs = require('fs-extra')

module.exports = (ipcMain, win) => {
	
	ipcMain.handle('sendCommand', async (event, r) => {
	
		// return {"received": someArgument}
	
		let res = execSync(r.command);
		//console.info('res.error', res.error);
		console.info('res', res.toString());
		
		return {back: "ok"};
	})
	
	
	ipcMain.handle('folderInfo', async (event, path) => {
		
		let isDir = false,
			listFiles = [];
	
		if(fs.lstatSync(path).isDirectory()){
			isDir = true;
			if(fs.pathExistsSync(path)){
	
				let files = fs.readdirSync(path);
				files.forEach(file => {
					if(!fs.lstatSync(path + "/" + file).isDirectory()){
						console.info('file', file);
						
						listFiles.push(file)
					}
				});
			}
		}else{
	
		}
		
		return {
			"isDir": isDir,
			"files": listFiles
		};
	})

	ipcMain.handle('triggerMetaCopy', async (event, r) => {
		/**
		 * r => {
		 * 	files: [{}, {}]
		 * 	
		 * }
		 */
	
		fs.ensureDir(`${r.dir}/${r.outputDir}`).then(() => {
			
			r.files.forEach((o, pos) => {
				let ext = o.original.substr(o.original.lastIndexOf('.')),
					oriName = o.original.substr(0, o.original.lastIndexOf('.'))

				if(fs.existsSync(`${r.dir}/${r.outputDir}/${oriName+ext}`)){

					win.webContents.send("fileStatus", {
						"error": null,  // if null, it means success
						"stderr": null,
						"stdout": "This file already exist in the destination folder.",
						"index": pos,
					});
				}else{
					
					// let newNameWhenCopied = o.original.replace(ext, "-metaAdded")
					let command = `ffmpeg -i "${r.dir}/${o.original}" -i "${r.dir}/${o.compressed}" -movflags use_metadata_tags  -map 1 -map_metadata 0 -c copy "${r.dir}/${r.outputDir}/${oriName+ext}"`
		
					console.info("command", command);
		
					exec(command, (error, stdout, stderr) => {
						console.info({
							"error": error,  // if null, it means success
							"stderr": stderr,
							"stdout": stdout,
							"index": pos,
						});
						
						win.webContents.send("fileStatus", {
							"error": error,  // if null, it means success
							"stderr": stderr,
							"stdout": stdout,
							"index": pos,
						});
					});
				}
			})
		})
		return true;
	})
}

