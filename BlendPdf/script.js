document.addEventListener("DOMContentLoaded", () => {
  const App = {
    // UI Elements
    header: document.getElementById("main-header"),
    hamburger: document.getElementById("hamburger-menu"),
    mobileNav: document.getElementById("mobile-nav"),
    toolsGrid: document.getElementById("tools-grid"),
    footerToolsList: document.getElementById("footer-tools-list"),
    themeToggle: document.getElementById("theme-toggle"),
    modal: document.getElementById("tool-modal"),
    modalTitle: document.getElementById("modal-title"),
    modalIconContainer: document.getElementById("modal-icon-container"),
    modalClose: document.getElementById("modal-close"),
    modalBody: document.getElementById("modal-body"),
    modalFooter: document.querySelector(".modal-footer"),
    step1: document.getElementById("step-1-upload"),
    step2: document.getElementById("step-2-configure"),
    dropArea: document.getElementById("drop-area"),
    fileSelectBtn: document.getElementById("file-select-btn"),
    fileInput: document.getElementById("file-input"),
    fileList: document.getElementById("file-list"),
    addMoreFilesBtn: document.getElementById("add-more-files-footer"),
    toolOptionsWrapper: document.getElementById("tool-options-wrapper"),
    processBtn: document.getElementById("process-btn"),
    outputArea: document.getElementById("output-area"),
    organizePagesContainer: document.getElementById("organize-pages-container"),
    loader: document.getElementById("loader-overlay"),
    loaderText: document.getElementById("loader-text"),

    // State
    files: [],
    currentTool: null,
    pdfDoc: null,
    PDFLib: window.PDFLib,

    // Methods
    showLoader: (text = "Processing...") => {
      App.loaderText.textContent = text;
      App.loader.style.display = "flex";
    },
    hideLoader: () => {
      App.loader.style.display = "none";
    },
    showError: (message) => {
      alert(`Error: ${message}`);
      console.error(message);
      App.hideLoader();
    },

    createDownloadLink: (data, filename, type) => {
      const blob = new Blob([data], { type });
      const url = URL.createObjectURL(blob);
      App.outputArea.innerHTML = `
                <div class="success-message">
                    <div class="success-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>
                    </div>
                    <h3>Success!</h3>
                    <p>Your file has been processed and is ready for download.</p>
                    <a href="${url}" download="${filename}" class="download-btn">Download File</a>
                </div>
            `;
      App.processBtn.style.display = "none";
      App.addMoreFilesBtn.style.display = "none";
    },

    resetModal: () => {
      App.files = [];
      App.currentTool = null;
      App.pdfDoc = null;
      App.fileInput.value = "";
      App.updateFileList();
      App.toolOptionsWrapper.innerHTML = "";
      App.outputArea.innerHTML = "";
      App.organizePagesContainer.innerHTML = "";
      App.organizePagesContainer.style.display = "none";

      App.step1.classList.add("active");
      App.step2.classList.remove("active");
      App.modalFooter.style.display = "none";
      App.processBtn.style.display = "inline-block";
      App.processBtn.disabled = true;
    },

    updateFileList: () => {
      App.fileList.innerHTML = "";
      App.files.forEach((file, index) => {
        const li = document.createElement("li");
        const fileSize = (file.size / 1024 / 1024).toFixed(2); // MB
        li.innerHTML = `
                    <span class="file-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                    </span>
                    <div class="file-info">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${fileSize} MB</span>
                    </div>
                    <button class="remove-file" data-index="${index}" aria-label="Remove file">×</button>
                `;
        App.fileList.appendChild(li);
      });

      App.fileList.querySelectorAll(".remove-file").forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const index = parseInt(e.currentTarget.dataset.index, 10);
          App.files.splice(index, 1);
          App.updateFileList();
          if (App.files.length === 0) {
            App.step1.classList.add("active");
            App.step2.classList.remove("active");
            App.modalFooter.style.display = "none";
          }
        });
      });

      App.processBtn.disabled = App.files.length === 0;
      App.addMoreFilesBtn.style.display = App.currentTool?.multiple
        ? "inline-block"
        : "none";
    },
  };

  // Tool Definitions and Icons
  const icons = {
    merge:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M12 11v6"></path><path d="m9 14 3 3 3-3"></path></svg>',
    split:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
    compress:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 10-4 4m0-4 4 4"/><path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2"/><path d="M18 6h-2V4M6 18h2v2M18 18h-2v2M6 6h2V4"/></svg>',
    organize:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M8 12h8"></path><path d="M8 16h3"></path></svg>',
    extractImages:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line><path d="M12 3v12"></path><path d="m17 8-5-5-5 5"></path><path d="M5 21v-4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"></path><path d="M12 15v6"></path></svg>',
    rotate:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 8a5.5 5.5 0 0 1 8.25-4.75L12 5.5V2.75A5.5 5.5 0 0 1 17.5 8"/><path d="M21.5 16a5.5 5.5 0 0 1-8.25 4.75L12 18.5v2.75a5.5 5.5 0 0 1-5.5-5.5"/><path d="M8 2.5a5.5 5.5 0 0 1 4.75 8.25L10.5 12h2.75a5.5 5.5 0 0 1 5.5 5.5"/><path d="M16 21.5a5.5 5.5 0 0 1-4.75-8.25L13.5 12H10.75a5.5 5.5 0 0 1-5.5-5.5"/></svg>',
    unlock:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>',
    protect:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
    repair:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path><path d="M12 3v2"></path><path d="M12 19v2"></path><path d="m20.66 7.34-1.42 1.42"></path><path d="m4.77 17.83 1.42-1.42"></path><path d="m20.66 16.66-1.42-1.42"></path><path d="m4.77 6.17 1.42 1.42"></path><path d="M21 12h-2"></path><path d="M5 12H3"></path></svg>',
  };

  const toolImplementations = {
    "merge-pdf": {
      id: "merge-pdf",
      title: "Merge PDF",
      desc: "Combine multiple PDFs into one single, organized document.",
      icon: icons.merge,
      fileType: ".pdf",
      multiple: true,
      process: async (files) => {
        App.showLoader("Merging PDFs...");
        const mergedPdf = await App.PDFLib.PDFDocument.create();
        for (const file of files) {
          const pdfBytes = await file.arrayBuffer();
          const pdfDoc = await App.PDFLib.PDFDocument.load(pdfBytes, {
            ignoreEncryption: true,
          });
          const copiedPages = await mergedPdf.copyPages(
            pdfDoc,
            pdfDoc.getPageIndices()
          );
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        const mergedPdfBytes = await mergedPdf.save();
        App.createDownloadLink(mergedPdfBytes, "merged.pdf", "application/pdf");
        App.hideLoader();
      },
    },
    "split-pdf": {
      id: "split-pdf",
      title: "Split PDF",
      desc: "Extract a range of pages or split one PDF into many.",
      icon: icons.split,
      fileType: ".pdf",
      multiple: false,
      options: () =>
        `<div class="options-panel"><label for="page-range">Page range (e.g., 1-3, 5):</label><input type="text" id="page-range" placeholder="e.g., 1-3, 5, 8-10"></div>`,
      process: async (files, options) => {
        App.showLoader("Splitting PDF...");
        const range = options["page-range"];
        if (!range) {
          App.showError("Please specify a page range.");
          return;
        }
        const pdfBytes = await files[0].arrayBuffer();
        const pdfDoc = await App.PDFLib.PDFDocument.load(pdfBytes, {
          ignoreEncryption: true,
        });
        const newPdf = await App.PDFLib.PDFDocument.create();
        const indices = new Set();
        const totalPages = pdfDoc.getPageCount();
        range.split(",").forEach((part) => {
          part = part.trim();
          if (part.includes("-")) {
            let [start, end] = part.split("-").map(Number);
            start = Math.max(1, start);
            end = Math.min(totalPages, end);
            for (let i = start; i <= end; i++) indices.add(i - 1);
          } else {
            const pageNum = Number(part);
            if (pageNum > 0 && pageNum <= totalPages) indices.add(pageNum - 1);
          }
        });
        if (indices.size === 0) {
          App.showError("Invalid page range.");
          return;
        }
        const copiedPages = await newPdf.copyPages(
          pdfDoc,
          Array.from(indices).sort((a, b) => a - b)
        );
        copiedPages.forEach((page) => newPdf.addPage(page));
        const newPdfBytes = await newPdf.save();
        App.createDownloadLink(newPdfBytes, "split.pdf", "application/pdf");
        App.hideLoader();
      },
    },
    "compress-pdf": {
      id: "compress-pdf",
      title: "Compress PDF",
      desc: "Reduce the file size of your PDF while optimizing for quality.",
      icon: icons.compress,
      fileType: ".pdf",
      multiple: false,
      options: () =>
        `<div class="options-panel"><label for="quality">Image Quality (0.1=small, 1.0=high):</label><input type="range" id="quality" min="0.1" max="1.0" step="0.1" value="0.7"><p style="font-size:0.9rem; color: var(--text-secondary); margin-top: 0.5rem;">Note: This process rasterizes pages, which may make text non-selectable.</p></div>`,
      process: async (files, options) => {
        App.showLoader("Compressing PDF...");
        const quality = parseFloat(options.quality);
        const pdfBytes = await files[0].arrayBuffer();
        const pdfJSDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
        const newPdfDoc = await App.PDFLib.PDFDocument.create();
        for (let i = 1; i <= pdfJSDoc.numPages; i++) {
          App.showLoader(`Processing page ${i}/${pdfJSDoc.numPages}...`);
          const page = await pdfJSDoc.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext("2d");
          await page.render({ canvasContext: context, viewport }).promise;
          const jpgImageBytes = await new Promise((resolve) =>
            canvas.toBlob(
              (blob) => {
                const reader = new FileReader();
                reader.onload = () => resolve(new Uint8Array(reader.result));
                reader.readAsArrayBuffer(blob);
              },
              "image/jpeg",
              quality
            )
          );
          const jpgImage = await newPdfDoc.embedJpg(jpgImageBytes);
          const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
          newPage.drawImage(jpgImage, {
            x: 0,
            y: 0,
            width: viewport.width,
            height: viewport.height,
          });
        }
        const compressedPdfBytes = await newPdfDoc.save();
        App.createDownloadLink(
          compressedPdfBytes,
          "compressed.pdf",
          "application/pdf"
        );
        App.hideLoader();
      },
    },
    "organize-pdf": {
      id: "organize-pdf",
      title: "Organize PDF",
      desc: "Visually reorder, rotate, or delete pages from your document.",
      icon: icons.organize,
      fileType: ".pdf",
      multiple: false,
      onFileSelect: setupOrganizeUI,
      process: async (files) => {
        App.showLoader("Organizing PDF...");
        const pageContainer = App.organizePagesContainer;
        const newOrderIndices = Array.from(pageContainer.children).map((el) =>
          parseInt(el.dataset.originalIndex)
        );
        const pdfBytes = await files[0].arrayBuffer();
        const pdfDoc = await App.PDFLib.PDFDocument.load(pdfBytes, {
          ignoreEncryption: true,
        });
        const newPdf = await App.PDFLib.PDFDocument.create();
        const pagesToCopy = await newPdf.copyPages(pdfDoc, newOrderIndices);
        pagesToCopy.forEach((page, i) => {
          const rotationDegrees = parseInt(
            pageContainer.children[i].dataset.rotation || "0"
          );
          page.setRotation(App.PDFLib.degrees(rotationDegrees));
          newPdf.addPage(page);
        });
        const newPdfBytes = await newPdf.save();
        App.createDownloadLink(newPdfBytes, "organized.pdf", "application/pdf");
        App.hideLoader();
      },
    },
    "extract-images": {
      id: "extract-images",
      title: "Extract Images",
      desc: "Pull all embedded images out of a PDF into a ZIP file.",
      icon: icons.extractImages,
      fileType: ".pdf",
      multiple: false,
      process: async (files) => {
        App.showLoader("Extracting images...");
        const arrayBuffer = await files[0].arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const zip = new JSZip();
        let imageCount = 0;
        for (let i = 1; i <= pdf.numPages; i++) {
          App.showLoader(`Scanning page ${i}/${pdf.numPages}...`);
          const page = await pdf.getPage(i);
          const operatorList = await page.getOperatorList();
          for (let j = 0; j < operatorList.fnArray.length; j++) {
            if (operatorList.fnArray[j] === pdfjsLib.OPS.paintImageXObject) {
              try {
                const imageName = operatorList.argsArray[j][0];
                const image = await page.objs.get(imageName);
                if (!image || !image.data) continue;
                const { width, height, kind } = image;
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                let imageData;
                if (kind === pdfjsLib.ImageKind.GRAYSCALE_1BPP) {
                  imageData = new ImageData(width, height);
                  let k = 0;
                  for (let p = 0; p < image.data.length; p++) {
                    for (let b = 7; b >= 0; b--) {
                      const pixel = image.data[p] & (1 << b) ? 0 : 255;
                      imageData.data[k++] = pixel;
                      imageData.data[k++] = pixel;
                      imageData.data[k++] = pixel;
                      imageData.data[k++] = 255;
                      if (k % (width * 4) === 0) break;
                    }
                  }
                } else if (kind === pdfjsLib.ImageKind.RGB_24BPP) {
                  imageData = new ImageData(
                    new Uint8ClampedArray(image.data),
                    width,
                    height
                  );
                } else if (kind === pdfjsLib.ImageKind.RGBA_32BPP) {
                  imageData = new ImageData(
                    new Uint8ClampedArray(image.data),
                    width,
                    height
                  );
                } else {
                  continue;
                }
                ctx.putImageData(imageData, 0, 0);
                const dataUrl = canvas.toDataURL("image/png");
                zip.file(
                  `image_${++imageCount}_from_page_${i}.png`,
                  dataUrl.substring(dataUrl.indexOf(",") + 1),
                  { base64: true }
                );
              } catch (e) {
                console.warn(`Could not extract an image from page ${i}:`, e);
              }
            }
          }
        }
        if (imageCount === 0) {
          App.hideLoader();
          App.showError("No extractable images found in this PDF.");
          return;
        }
        const content = await zip.generateAsync({ type: "blob" });
        App.createDownloadLink(
          content,
          "extracted_images.zip",
          "application/zip"
        );
        App.hideLoader();
      },
    },
    "rotate-pdf": {
      id: "rotate-pdf",
      title: "Rotate PDF",
      desc: "Rotate all pages in a PDF document 90, 180, or 270 degrees.",
      icon: icons.rotate,
      fileType: ".pdf",
      multiple: false,
      process: async (files, options) => {
        App.showLoader("Rotating PDF...");
        const { PDFDocument, degrees } = App.PDFLib;
        const angle = 90;
        const pdfBytes = await files[0].arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes, {
          ignoreEncryption: true,
        });
        pdfDoc.getPages().forEach((page) => {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees(currentRotation + angle));
        });
        const rotatedBytes = await pdfDoc.save();
        App.createDownloadLink(rotatedBytes, "rotated.pdf", "application/pdf");
        App.hideLoader();
      },
    },
    "unlock-pdf": {
      id: "unlock-pdf",
      title: "Unlock PDF",
      desc: "Remove password and restrictions from an encrypted PDF.",
      icon: icons.unlock,
      fileType: ".pdf",
      multiple: false,
      options: () =>
        `<div class="options-panel"><label for="pdf-password">PDF Password:</label><input type="password" id="pdf-password" placeholder="Required to unlock"></div>`,
      process: async (files, options) => {
        App.showLoader("Attempting to unlock PDF...");
        const password = options["pdf-password"];
        if (!password) {
          App.showError("Password is required to unlock a PDF.");
          return;
        }
        try {
          const pdfBytes = await files[0].arrayBuffer();
          const pdfDoc = await App.PDFLib.PDFDocument.load(pdfBytes, {
            password,
          });
          const unlockedBytes = await pdfDoc.save();
          App.createDownloadLink(
            unlockedBytes,
            "unlocked.pdf",
            "application/pdf"
          );
        } catch (e) {
          App.showError(
            "Failed to unlock PDF. Incorrect password or unsupported encryption."
          );
        }
        App.hideLoader();
      },
    },
    "protect-pdf": {
      id: "protect-pdf",
      title: "Protect PDF",
      desc: "Add a password and encrypt your PDF file for security.",
      icon: icons.protect,
      fileType: ".pdf",
      multiple: false,
      options: () =>
        `<div class="options-panel"><label for="owner-password">Password to open:</label><input type="password" id="owner-password" required></div>`,
      process: async (files, options) => {
        App.showLoader("Protecting PDF...");
        const password = options["owner-password"];
        if (!password) {
          App.showError("Password cannot be empty.");
          return;
        }
        const pdfBytes = await files[0].arrayBuffer();
        const pdfDoc = await App.PDFLib.PDFDocument.load(pdfBytes, {
          ignoreEncryption: true,
        });
        await pdfDoc
          .save({ useObjectStreams: false, userPassword: password })
          .then((protectedBytes) => {
            App.createDownloadLink(
              protectedBytes,
              "protected.pdf",
              "application/pdf"
            );
          });
        App.hideLoader();
      },
    },
    "repair-pdf": {
      id: "repair-pdf",
      title: "Repair PDF",
      desc: "Attempt to recover data from a corrupt or damaged PDF.",
      icon: icons.repair,
      fileType: ".pdf",
      multiple: false,
      process: async () =>
        App.showError(
          "PDF repair is an extremely advanced function not possible in the browser. This feature is a placeholder."
        ),
    },
  };

  function applyTheme(theme) {
    document.body.classList.toggle("dark-mode", theme === "dark");
  }

  function openModal(toolId) {
    App.resetModal();
    App.currentTool = toolImplementations[toolId];
    if (!App.currentTool) return;

    App.modalTitle.textContent = App.currentTool.title;
    App.modalIconContainer.innerHTML = App.currentTool.icon;
    App.fileInput.accept = App.currentTool.fileType || "";
    App.fileInput.multiple = App.currentTool.multiple || false;

    if (App.currentTool.options) {
      App.toolOptionsWrapper.innerHTML = App.currentTool.options();
    }

    App.modal.classList.add("visible");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    App.modal.classList.remove("visible");
    document.body.style.overflow = "";
    App.resetModal();
  }

  function handleFiles(selectedFiles) {
    const tool = App.currentTool;
    if (!tool) return;

    const newFiles = Array.from(selectedFiles);
    if (newFiles.length === 0) return;

    const acceptedTypes = tool.fileType
      .split(",")
      .map((t) => t.trim().toLowerCase());
    const validFiles = newFiles.filter((file) => {
      const extension = "." + file.name.split(".").pop().toLowerCase();
      return acceptedTypes.some((type) =>
        type.startsWith(".")
          ? extension === type
          : file.type.toLowerCase() === type
      );
    });

    if (validFiles.length !== newFiles.length) {
      App.showError(`Invalid file type. Please select ${tool.fileType} files.`);
      return;
    }

    if (tool.multiple) {
      App.files.push(...validFiles);
    } else {
      App.files = [validFiles[0]];
    }

    App.updateFileList();

    if (App.files.length > 0) {
      App.step1.classList.remove("active");
      App.step2.classList.add("active");
      App.modalFooter.style.display = "flex";
    }

    if (tool.onFileSelect) {
      tool.onFileSelect();
    }
  }

  async function setupOrganizeUI() {
    App.fileList.style.display = "none";
    App.organizePagesContainer.style.display = "grid";
    App.processBtn.disabled = true;
    App.showLoader("Loading page thumbnails...");
    const arrayBuffer = await App.files[0].arrayBuffer();
    App.pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    for (let i = 1; i <= App.pdfDoc.numPages; i++) {
      const page = await App.pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 0.3 });
      const canvas = document.createElement("canvas");
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const context = canvas.getContext("2d");
      await page.render({ canvasContext: context, viewport }).promise;
      const pageItem = document.createElement("div");
      pageItem.className = "organize-page-item";
      pageItem.draggable = true;
      pageItem.dataset.originalIndex = i - 1;
      pageItem.dataset.rotation = "0";
      pageItem.innerHTML = `<div class="page-number">${i}</div><div class="page-actions"><button class="rotate-page" title="Rotate 90°">↻</button><button class="delete-page" title="Delete">×</button></div>`;
      pageItem.prepend(canvas);
      App.organizePagesContainer.appendChild(pageItem);
    }
    App.hideLoader();
    App.processBtn.disabled = false;
    const container = App.organizePagesContainer;
    container
      .querySelectorAll(".delete-page")
      .forEach(
        (btn) =>
          (btn.onclick = (e) =>
            e.currentTarget.closest(".organize-page-item").remove())
      );
    container.querySelectorAll(".rotate-page").forEach(
      (btn) =>
        (btn.onclick = (e) => {
          const item = e.currentTarget.closest(".organize-page-item");
          const canvas = item.querySelector("canvas");
          let currentRotation = parseInt(item.dataset.rotation);
          currentRotation = (currentRotation + 90) % 360;
          item.dataset.rotation = currentRotation;
          canvas.style.transform = `rotate(${currentRotation}deg)`;
        })
    );
    let draggedItem = null;
    container.addEventListener("dragstart", (e) => {
      if (!e.target.classList.contains("organize-page-item")) return;
      draggedItem = e.target;
      setTimeout(() => (e.target.style.opacity = "0.5"), 0);
    });
    container.addEventListener("dragend", (e) => {
      if (!e.target.classList.contains("organize-page-item")) return;
      setTimeout(() => (e.target.style.opacity = "1"), 0);
      draggedItem = null;
    });
    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(container, e.clientY);
      if (draggedItem) {
        if (afterElement == null) {
          container.appendChild(draggedItem);
        } else {
          container.insertBefore(draggedItem, afterElement);
        }
      }
    });
    function getDragAfterElement(container, y) {
      const draggableElements = [
        ...container.querySelectorAll(".organize-page-item:not(.dragging)"),
      ];
      return draggableElements.reduce(
        (closest, child) => {
          const box = child.getBoundingClientRect();
          const offset = y - box.top - box.height / 2;
          if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
          } else {
            return closest;
          }
        },
        { offset: Number.NEGATIVE_INFINITY }
      ).element;
    }
  }

  function generateToolCards() {
    const fragment = document.createDocumentFragment();
    const visibleTools = [
      "merge-pdf",
      "split-pdf",
      "compress-pdf",
      "organize-pdf",
      "extract-images",
      "rotate-pdf",
      "unlock-pdf",
      "protect-pdf",
      "repair-pdf",
    ];
    visibleTools.forEach((key, index) => {
      const tool = toolImplementations[key];
      const card = document.createElement("div");
      card.className = "tool-card reveal";
      card.dataset.toolId = key;
      card.style.transitionDelay = `${index * 50}ms`;
      card.innerHTML = `<div class="icon">${tool.icon}</div><h3>${tool.title}</h3><p>${tool.desc}</p>`;
      card.addEventListener("click", () => openModal(key));
      fragment.appendChild(card);
    });
    App.toolsGrid.appendChild(fragment);
    const topTools = ["merge-pdf", "split-pdf", "compress-pdf", "organize-pdf"];
    topTools.forEach((key) => {
      const tool = toolImplementations[key];
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#all-tools";
      a.textContent = tool.title;
      a.onclick = (e) => {
        e.preventDefault();
        openModal(key);
      };
      li.appendChild(a);
      App.footerToolsList.appendChild(li);
    });
  }

  function init() {
    // Theme and basic event listeners
    const savedTheme =
      localStorage.getItem("theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    applyTheme(savedTheme);
    window.addEventListener("scroll", () => {
      App.header.classList.toggle("scrolled", window.scrollY > 50);
    });
    App.hamburger.addEventListener("click", () => {
      App.mobileNav.classList.toggle("open");
    });
    App.mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        App.mobileNav.classList.remove("open");
      });
    });
    App.themeToggle.addEventListener("click", () => {
      const newTheme = document.body.classList.contains("dark-mode")
        ? "light"
        : "dark";
      localStorage.setItem("theme", newTheme);
      applyTheme(newTheme);
    });

    // Modal event listeners
    App.modalClose.addEventListener("click", closeModal);
    App.modal.addEventListener("click", (e) => {
      if (e.target.id === "tool-modal") closeModal();
    });
    App.dropArea.addEventListener("click", () => App.fileInput.click());
    App.dropArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      App.dropArea.classList.add("dragover");
    });
    App.dropArea.addEventListener("dragleave", () => {
      App.dropArea.classList.remove("dragover");
    });
    App.dropArea.addEventListener("drop", (e) => {
      e.preventDefault();
      App.dropArea.classList.remove("dragover");
      handleFiles(e.dataTransfer.files);
    });
    App.fileSelectBtn.addEventListener("click", () => App.fileInput.click());
    App.addMoreFilesBtn.addEventListener("click", () => App.fileInput.click());
    App.fileInput.addEventListener("change", (e) =>
      handleFiles(e.target.files)
    );

    App.processBtn.addEventListener("click", () => {
      if (App.currentTool && App.currentTool.process) {
        const options = {};
        App.toolOptionsWrapper
          .querySelectorAll("input, select, textarea")
          .forEach((el) => {
            options[el.id] = el.type === "checkbox" ? el.checked : el.value;
          });
        App.currentTool.process(App.files, options).catch(App.showError);
      }
    });

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    generateToolCards();
    document
      .querySelectorAll(".reveal")
      .forEach((el) => revealObserver.observe(el));
  }

  init();
});
