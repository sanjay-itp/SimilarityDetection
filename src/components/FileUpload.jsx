import { useId, useState } from "react";
import { fileSize } from "../utils/format.js";

/**
 * Drag-and-drop or click-to-browse file picker that checks type and size.
 * accept: ".pdf,.docx"   file: the chosen File (or {name,size})   onFile(fileOrNull)
 */
export default function FileUpload({ accept, maxMb = 10, title, hint, file, onFile, fileNote }) {
  const id = useId();
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const allowed = accept.split(",").map((s) => s.trim().toLowerCase());

  function handle(f) {
    if (!f) return;
    const ext = "." + f.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setError(`Please choose a ${allowed.join(" or ")} file.`);
      return;
    }
    if (f.size > maxMb * 1048576) {
      setError(`This file is larger than ${maxMb} MB.`);
      return;
    }
    setError("");
    onFile(f);
  }

  return (
    <div className="stack stack--tight">
      {!file && (
        <label
          htmlFor={id}
          className={`upload${dragging ? " is-dragover" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handle(e.dataTransfer.files[0]);
          }}
        >
          <input
            id={id}
            className="sr-only"
            type="file"
            accept={accept}
            onChange={(e) => {
              handle(e.target.files[0]);
              e.target.value = "";
            }}
          />
          <span className="upload__title">{title}</span>
          <span className="upload__hint">{hint}</span>
        </label>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {file && (
        <div className="row">
          <div>
            <div className="row__title">{file.name}</div>
            <div className="row__meta">
              {fileSize(file.size)}
              {fileNote ? ` · ${fileNote}` : ""}
            </div>
          </div>
          <div className="row__actions">
            <button type="button" className="btn btn--small" onClick={() => onFile(null)}>
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Multiple-file picker. Checks each file's type and keeps the combined size
 * under maxTotalMb. files: array of File   onFiles(nextArray)
 */
export function MultiFileUpload({ accept, maxTotalMb = 10, title, hint, files, onFiles, fileNote }) {
  const id = useId();
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const allowed = accept.split(",").map((s) => s.trim().toLowerCase());
  const total = files.reduce((n, f) => n + f.size, 0);
  const limit = maxTotalMb * 1048576;

  function add(list) {
    const picked = Array.from(list || []);
    if (!picked.length) return;
    const bad = picked.find((f) => !allowed.includes("." + f.name.split(".").pop().toLowerCase()));
    if (bad) {
      setError(`${bad.name} is not allowed. Choose ${allowed.join(", ")} files.`);
      return;
    }
    const next = [...files];
    for (const f of picked) {
      const i = next.findIndex((x) => x.name === f.name);
      if (i >= 0) next[i] = f;
      else next.push(f);
    }
    if (next.reduce((n, f) => n + f.size, 0) > limit) {
      setError(`These files add up to more than ${maxTotalMb} MB in total.`);
      return;
    }
    setError("");
    onFiles(next);
  }

  return (
    <div className="stack stack--tight">
      <label
        htmlFor={id}
        className={`upload${dragging ? " is-dragover" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        }}
      >
        <input
          id={id}
          className="sr-only"
          type="file"
          multiple
          accept={accept}
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
        <span className="upload__title">{title}</span>
        <span className="upload__hint">{hint}</span>
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {files.map((f) => (
        <div className="row" key={f.name}>
          <div>
            <div className="row__title">{f.name}</div>
            <div className="row__meta">
              {fileSize(f.size)}
              {fileNote ? ` · ${fileNote}` : ""}
            </div>
          </div>
          <div className="row__actions">
            <button type="button" className="btn btn--small" onClick={() => onFiles(files.filter((x) => x !== f))}>
              Remove
            </button>
          </div>
        </div>
      ))}
      {files.length > 0 && (
        <p className="help">
          {files.length} file{files.length === 1 ? "" : "s"} · {fileSize(total)} of {maxTotalMb} MB used
        </p>
      )}
    </div>
  );
}
