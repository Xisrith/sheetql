import React, { useState } from 'react';
import './index.css';
import { ImportModal } from '../ImportModal';

export const DragDrop = () => {
  const [drag, setDrag] = useState<boolean>(false);
  const [_, setFile] = useState<File | null>(null);
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;
    setDrag(false);
    setFile(droppedFiles.item(0));
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
      <ImportModal open={false} onCancel={() => setFile(null)} />
    </section>
  );
};
