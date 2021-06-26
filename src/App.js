import React, { useState, useRef, useEffect } from 'react'
const electron = window.require('electron');

console.info('window.electron', electron);

var {info, log, warn} = console
/**
	https://getuikit.com/docs/alert
	HandBrake CLI command line: https://handbrake.fr/downloads2.php
 */

const direOut = "meta_added";
const initVar = {
	dir: null,
	files: [],
	resOp: [],	
	logInfo: {success: [], error: []}
}

function App() {
	
	const folderUncompressedSelection = useRef(null)
	
	const [dir, setDir] = useState(initVar.dir);
	const [files, setFiles] = useState(initVar.files.slice(0));
	const [resOp, setResOp] = useState(initVar.resOp.slice(0)); // Res operation
	const [logInfo, setLogInfo] = useState(Object.assign({}, initVar.logInfo)) // User log
	/* useEffect(() => {
		info('file:', folderUncompressedSelection)
	}, [folderUncompressedSelection]) */

	useEffect(() => {
		electron.ipcRenderer.on('fileStatus', (event, r) => {
			console.info('Render fileStatus', r);
			resOp[r.index] = r
			setResOp(resOp.slice(0));
		})
	}, [])
	
	const reset = () => {

		setDir(initVar.dir);
		setFiles(initVar.files.slice(0));
		setResOp(initVar.resOp.slice(0));
	}
	
	const trigger = () => {

		if(!dir)
			return

		electron.ipcRenderer.invoke('folderInfo', dir.path).then((r) => {
			console.info('Render folderInfo', r);

			let ordered = [];
			if(r.files.length > 0){
				/**
				 * We seperate path from original file from path from copie by checking the name with or without "-1" at the end since 
				 * this is the common name for HandBrake
				 */
				r.files.forEach(path => {

					let pathToLookFor = path.substr(0, path.lastIndexOf(".")),
						isOriCompressed = false

					if(path.lastIndexOf("-1") !== -1){
						pathToLookFor = path.substr(0, path.length-2)
						isOriCompressed = true;
					}

					let found = r.files.find(p1 => {
						if(p1.substr(0, path.lastIndexOf(".")) === pathToLookFor)	return p1;
						return false;
					})

					if(found)
						ordered.push({
							"original": isOriCompressed? found : path,
							"compressed": isOriCompressed? path : found
						})
				})
			}
			info('ordered', ordered)
			setFiles(ordered)
		})
		
		info('file:', folderUncompressedSelection)
	}

	const triggerMetaCopy = () => {

		if(!dir)
			return

		electron.ipcRenderer.invoke('triggerMetaCopy', {
			"dir": `${dir.path.replaceAll("\\", "/")}`,
			"outputDir": direOut,
			"files": files
		})
		
		info('file:', folderUncompressedSelection)
	}
	
	const eventDragDrop = (e) => {
		e.preventDefault();
		e.stopPropagation();
	
		for (const f of e.dataTransfer.files) {
			console.log('File(s) you dragged here: ', f.path)
			setDir(f)
		}
	}
	
	const eventDragOver = (e) => {
		e.preventDefault();
		e.stopPropagation();
	}

	let dirSelected = dir? dir.path.substr(dir.path.lastIndexOf("\\") + 1) : ""

	if(dir && dir.path.lastIndexOf("/") !== -1)
		dirSelected = dir.path.substr(dir.path.lastIndexOf("/") + 1)


		console.info('logInfo' , logInfo);
		
	return (
		<div className="App d-flex d-flex justify-content-center align-items-center h-100 w-100 bg-secondary">
			<div className="d-flex flex-column border w-70 pt-4 px-4 pt-4 bg-light rounded">
				<div className="d-flex flex-row justify-content-center">
					<div className="rounded text-light bg-dark bg-gradient d-flex d-flex flex-column justify-content-center align-items-center border d-inline-block" style={{/* width: "150px", height: "100px" */ minWidth: "250px", minHeight: "150px" }} onDrop={eventDragDrop} onDragOver={eventDragOver}>
						Drag your folder here
						<div className={"text-center smallText " + (!dir? "d-none" : "")}>
							<div className="text-success">Selected:</div>
							<span className="fw-bold text-break">{dirSelected}</span>
						</div>
					</div>
					{/* <div className="p-3">
						<div className="mb-3">
							<input className="form-control" type="file" ref={folderUncompressedSelection}/>
						</div>
					</div> */}
				</div>
				<div className="p-2 mt-2">
					{
						files.length > 0? <div className="container">
							<div className="row fw-bold">
								<div className="col">Original</div>
								<div className="col">Compressed</div>
							</div>
							{
								files.map((o, pos) => {
									return <div key={`file_${o.original}`} className={"row smallText"}>
										<div className="col">{o.original}</div>
										<div className="col">{o.compressed}</div>
										{ 
											resOp.length > 0? <div className="col d-flex align-items-center">
												<i title={resOp[pos].error? resOp[pos].error : resOp[pos].stdout} style={{fontSize: "20px"}} className={"bi " + ((!resOp[pos].error? "text-success bi-check-circle-fill" : "text-danger bi-x-circle-fill"))}></i>
											</div> : ''
										}
									</div>
								})
							}
						</div> : ''
					}
				</div>
				<div className="p-2 mt-2 mb-2">
					{ files.length > 0? <button type="button" className="btn btn-danger" onClick={reset}>Reset</button> : ""}
					{ files.length === 0 && dir? <button type="button" className="btn btn-primary" onClick={trigger}>Execute</button> : ""}
					{ files.length > 0? <button type="button" className="btn btn-success ms-4" onClick={triggerMetaCopy}>Copy MetaData</button> : "" }
				</div>
			</div>
			{
				<div className="position-absolute bottom-0 w-100 text-light ">
					{
						Object.keys(logInfo).map(type => {
							console.info('type', type);
							
							return <div key={`logInfo_${type}`} className={` ` + (type === "error"? "bg-danger bg-gradient" : "bg-success bg-gradient")}>
								{logInfo[type]}
							</div>
						})
					}
				</div>
			}
		</div>
	);
}

export default App;
