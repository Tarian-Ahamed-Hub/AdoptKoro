// NewPostForm.jsx
import React, { useState } from "react";
import axios from "../Configs/AxiosConfig";
import { useFilters } from "../Context/FilterContext";

const NewPostForm = () => {
  const { categories, districts } = useFilters();

  const MAX_IMAGES = 5;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    setFiles((prevFiles) => {
      const remainingSlots = MAX_IMAGES - prevFiles.length;
      if (remainingSlots <= 0) {
        alert("Maximum of 5 images allowed.");
        return prevFiles;
      }
      const filesToAdd = selectedFiles.slice(0, remainingSlots);
      return [...prevFiles, ...filesToAdd];
    });

    e.target.value = null;
  };

  const handleRemoveFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("Please fill in both title and content.");
      return;
    }

    if (!selectedCategory) {
      alert("Please select a category.");
      return;
    }

    if (!selectedDistrict) {
      alert("Please select a district.");
      return;
    }

    if (files.length === 0) {
      alert("Please add at least one image.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);

    // Send category name only
    formData.append("category", selectedCategory);

    // Find the selected district object and format it
    const districtObj = districts.find((dist) => dist.district === selectedDistrict);
    
    const districtData = {
      district: districtObj.district,
      coordinate: [ districtObj.longitude,districtObj.latitude]
    };

    formData.append("district", JSON.stringify(districtData));

    files.forEach((file) => {
      if (file instanceof File) {
        formData.append("pics", file);
      } else {
        console.error("Not a real File!", file);
      }
    });

    for (let [key, value] of formData.entries()) {
      console.log("FormData entry:", key, value);
    }

    try {
      const response = await axios.post("/api/post/private/create", formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Post created:", response.data.message);

      // setTitle("");
      // setContent("");
      // setFiles([]);
      // setSelectedCategory("");
      // setSelectedDistrict("");
    } catch (error) {
      console.error("Post creation error:", error);
    }
  };

  return (
    <div className="post-form-container">
      <div className="post-form">
        <h2 className="form-title">Create New Post</h2>

        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Title
          </label>
          <input
            type="text"
            id="title"
            className="form-input"
            placeholder="Enter post title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content" className="form-label">
            Content
          </label>
          <textarea
            id="content"
            className="form-textarea"
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category" className="form-label">
              Category
            </label>
            <select
              id="category"
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="district" className="form-label">
              District
            </label>
            <select
              id="district"
              className="form-select"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              <option value="">Select a district</option>
              {districts.map((district) => (
                <option key={district._id} value={district.district}>
                  {district.district}
                </option>
              ))}
            </select>
          </div>
        </div>

        {files.length > 0 && (
          <div className="images-section">
            <h3 className="section-title">
              Images ({files.length}/{MAX_IMAGES})
            </h3>
            <div className="images-grid">
              {files.map((file, index) => (
                <div key={`img-${index}`} className="image-preview">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Image ${index + 1}`}
                  />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => handleRemoveFile(index)}
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="fileInput" className="file-input-label">
            <svg
              className="upload-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Add Photos ({files.length}/{MAX_IMAGES})
          </label>
          <input
            type="file"
            id="fileInput"
            className="file-input"
            name="pics"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            disabled={files.length >= MAX_IMAGES}
          />
        </div>

        <button type="button" className="submit-btn" onClick={handleSubmit}>
          Create Post
        </button>
      </div>
    </div>
  );
};

export default NewPostForm;