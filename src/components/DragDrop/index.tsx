import React, { useEffect, useState } from 'react';
import './index.css';

export const DragDrop = () => {
  const [drag, setDrag] = useState<boolean>(false);
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;
    droppedFiles.item(0)?.text().then(result => console.log(result));
    console.log(droppedFiles);
    setDrag(false);
  };


  return (
    <section className="drag-drop">
      <div
        className={`document-uploader upload-box ${drag ? 'active' : ''}`}
        onDrop={handleDrop}
        onDragOver={(event) => {
          event.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
      >
        <div className="upload-info">
          <div>
            <p>Drag and drop your files here</p>
            <p>
              Supported files: .JPG, .PNG, .JPEEG, .PDF, .DOCX, .PPTX, .TXT,
              .XLSX
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
