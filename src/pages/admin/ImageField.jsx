import { useEffect, useState } from "react";
export default function ImageField({ existing, onChange, required = false }) {
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  return (
    <div className="image-field">
      <label htmlFor="image">
        {required ? "Dress image" : "Collection cover"}
      </label>
      {(preview || existing) && (
        <img
          className="upload-preview"
          src={preview || existing}
          alt="Selected image preview"
        />
      )}
      <input
        id="image"
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        required={required && !existing}
        aria-describedby="image-help image-error"
        onChange={(event) => {
          const file = event.target.files?.[0];
          setError("");
          if (
            file &&
            (!["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
              file.size > 5 * 1024 * 1024)
          ) {
            setError("Choose a JPG, PNG or WebP image under 5 MB.");
            event.target.value = "";
            onChange(null);
            setPreview("");
            return;
          }
          onChange(file || null);
          setPreview(file ? URL.createObjectURL(file) : "");
        }}
      />
      <p className="form-hint" id="image-help">
        JPG, PNG or WebP, up to 5 MB. A portrait photo works best. The full
        image will be displayed.
      </p>
      <p id="image-error" className="error form-hint" role="alert">
        {error}
      </p>
    </div>
  );
}
