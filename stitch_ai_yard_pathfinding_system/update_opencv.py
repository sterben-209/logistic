import re

filepath = r'D:\test everything\logistic\stitch_ai_yard_pathfinding_system\nexus_terminal_map_digitizer\code.html'
with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update UI buttons
btn_old = r'<button id="btn-ai-scale" class="flex-1 bg-purple-900/40 border border-purple-500 text-purple-300 py-1.5 rounded text-xs hover:bg-purple-600 hover:text-white transition-colors flex items-center justify-center gap-1" title="AI tự động tìm container">🤖 AI Scan</button>'
btn_new = r'<button id="btn-cv-crop" class="flex-1 bg-blue-900/40 border border-blue-500 text-blue-300 py-1.5 rounded text-xs hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center gap-1" title="Khoanh vùng OpenCV">🔍 CV Crop</button>'
html = html.replace(btn_old, btn_new)

# 2. Add OpenCV Worker initialization and replace AI mock logic
ai_logic_regex = re.compile(r'const aiScaleBtn = document\.getElementById\(\'btn-ai-scale\'\);.*?if\(aiScaleBtn\) \{.*?\n        \}', re.DOTALL)

cv_logic = """        // OpenCV Web Worker
        const workerCode = `
        importScripts('https://docs.opencv.org/4.8.0/opencv.js');
        cv['onRuntimeInitialized'] = () => { postMessage({ type: 'READY' }); };
        onmessage = function(e) {
            if (e.data.type === 'PROCESS') {
                const imgData = e.data.imageData;
                try {
                    let src = cv.matFromImageData(imgData);
                    let dst = new cv.Mat();
                    let edges = new cv.Mat();
                    let lines = new cv.Mat();
                    
                    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
                    cv.Canny(dst, edges, 50, 150, 3);
                    cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 30, 20, 5);
                    
                    if (lines.rows === 0) {
                        src.delete(); dst.delete(); edges.delete(); lines.delete();
                        throw new Error("Không tìm thấy đường vạch container nào.");
                    }
                    
                    let lengths = [];
                    for (let i = 0; i < lines.rows; ++i) {
                        let x1 = lines.data32S[i * 4];
                        let y1 = lines.data32S[i * 4 + 1];
                        let x2 = lines.data32S[i * 4 + 2];
                        let y2 = lines.data32S[i * 4 + 3];
                        lengths.push(Math.hypot(x2 - x1, y2 - y1));
                    }
                    
                    lengths.sort((a, b) => b - a);
                    let topLengths = lengths.slice(0, Math.max(1, Math.floor(lengths.length * 0.15)));
                    let avgPixelLength = topLengths.reduce((a, b) => a + b, 0) / topLengths.length;
                    
                    src.delete(); dst.delete(); edges.delete(); lines.delete();
                    
                    postMessage({ type: 'RESULT', px: avgPixelLength, ratio: avgPixelLength / 12.2, id: e.data.id });
                } catch (err) {
                    postMessage({ type: 'ERROR', error: err.message, id: e.data.id });
                }
            }
        };`;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const cvWorker = new Worker(URL.createObjectURL(blob));
        let isCvReady = false;
        
        let pendingCVMesures = {};
        const btnCvCrop = document.getElementById('btn-cv-crop');
        
        cvWorker.onmessage = (e) => {
            if (e.data.type === 'READY') {
                isCvReady = true;
            }
            else if (e.data.type === 'RESULT') {
                const pending = pendingCVMesures[e.data.id];
                if(pending) {
                    measurements.push({
                        id: 'cv_' + Date.now(), source: 'OpenCV', type: '40ft Auto',
                        m: 12.2, px: e.data.px, ratio: e.data.ratio,
                        p1: pending.p1, p2: pending.p2
                    });
                    updateMeasurementsUI();
                    delete pendingCVMesures[e.data.id];
                    btnCvCrop.innerHTML = '🔍 CV Crop';
                    btnCvCrop.disabled = false;
                }
            } else if (e.data.type === 'ERROR') {
                alert("OpenCV: " + e.data.error + "\\nĐã tự động chuyển sang Thước đo thủ công.");
                const pending = pendingCVMesures[e.data.id];
                if(pending) delete pendingCVMesures[e.data.id];
                btnCvCrop.innerHTML = '🔍 CV Crop';
                btnCvCrop.disabled = false;
                mode = 'ruler';
                rulerLine = [];
            }
        };
        
        if(btnCvCrop) {
            btnCvCrop.addEventListener('click', () => {
                if(!isCvReady) return alert("OpenCV đang được tải xuống từ CDN, vui lòng đợi vài giây...");
                mode = 'cv-crop';
                currentRect = null;
            });
        }
"""
html = ai_logic_regex.sub(cv_logic, html)


# 3. Handle Mouse Events for mode 'cv-crop'
mousedown_add = '''
            } else if (mode === 'cv-crop') {
                isDragging = true;
                currentRect = { startX: pos.x, startY: pos.y, width: 0, height: 0 };
'''
html = html.replace("} else if (mode === 'zone') {", mousedown_add + "            } else if (mode === 'zone') {", 1)


mousemove_add = '''
            if (isDragging && mode === 'cv-crop') {
                const pos = getMousePos(e);
                currentRect.width = pos.x - currentRect.startX;
                currentRect.height = pos.y - currentRect.startY;
            }
'''
html = html.replace("if (isDragging && mode === 'zone') {", mousemove_add + "            if (isDragging && mode === 'zone') {", 1)


mouseup_add = '''
            if (isDragging && mode === 'cv-crop') {
                isDragging = false;
                if (Math.abs(currentRect.width) > 20 / scale && Math.abs(currentRect.height) > 20 / scale) {
                    const x = currentRect.width < 0 ? currentRect.startX + currentRect.width : currentRect.startX;
                    const y = currentRect.height < 0 ? currentRect.startY + currentRect.height : currentRect.startY;
                    const w = Math.abs(currentRect.width);
                    const h = Math.abs(currentRect.height);
                    
                    const temp = document.createElement('canvas');
                    temp.width = w; temp.height = h;
                    const tctx = temp.getContext('2d');
                    
                    const sourceImg = bgImgData ? bgImgData : imgObj;
                    if(sourceImg) {
                        tctx.drawImage(sourceImg, x, y, w, h, 0, 0, w, h);
                        const imgData = tctx.getImageData(0, 0, w, h);
                        const mId = Date.now();
                        pendingCVMesures[mId] = { p1: {x,y}, p2: {x:x+w, y:y+h} };
                        
                        btnCvCrop.innerHTML = '<span class="material-symbols-outlined text-[14px] animate-spin">refresh</span> Processing...';
                        btnCvCrop.disabled = true;
                        
                        cvWorker.postMessage({ type: 'PROCESS', imageData: imgData, id: mId });
                    }
                }
                currentRect = null;
                mode = 'idle';
            }
'''
html = html.replace("if (isDragging && mode === 'zone') {", mouseup_add + "            if (isDragging && mode === 'zone') {", 1)


# 4. Update the draw() function
draw_rect_add = '''
            if (isDragging && mode === 'cv-crop' && currentRect) {
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 2 / scale;
                ctx.setLineDash([5/scale, 5/scale]);
                ctx.strokeRect(currentRect.startX, currentRect.startY, currentRect.width, currentRect.height);
                ctx.setLineDash([]);
            }
'''
html = html.replace("if (isDragging && mode === 'zone' && currentRect) {", draw_rect_add + "            if (isDragging && mode === 'zone' && currentRect) {", 1)


# Update the badge colors for OpenCV
html = html.replace("const badgeColor = m.source === 'AI' ? 'bg-purple-900 text-purple-300' : 'bg-red-900 text-red-300';", 
                    "const badgeColor = m.source === 'OpenCV' ? 'bg-blue-900 text-blue-300' : 'bg-red-900 text-red-300';")


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(html)
