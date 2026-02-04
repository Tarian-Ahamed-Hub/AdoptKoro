// NewPostForm.jsx
import React, { useState } from "react";
import axios from "../Configs/AxiosConfig";
import { useFilters } from "../Context/FilterContext";
import { toast } from "react-toastify";
 
const NewPostForm = () => {
  const { categories, districts } = useFilters();

  const MAX_IMAGES = 5;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("category", selectedCategory);

    const districtObj = districts.find((dist) => dist.district === selectedDistrict);
    const districtData = {
      district: districtObj.district,
      coordinate: [districtObj.longitude, districtObj.latitude]
    };
    formData.append("district", JSON.stringify(districtData));

    files.forEach((file) => {
      if (file instanceof File) {
        formData.append("pics", file);
      }
    });

    try {
      const response = await axios.post("/api/post/private/create", formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Post created:", response.data.message);
      toast.success(response.data.message || "Post created successfully!");

      setTitle("");
      setContent("");
      setFiles([]);
      setSelectedCategory("");
      setSelectedDistrict("");
      setShowForm(false);
    } catch (error) {
      toast.error(error.response?.data?.message );
      console.error("Post creation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="npf-wrapper">
      {!showForm ? (
        <div className="npf-trigger-container">
          <button 
            className="npf-trigger-btn" 
            onClick={() => setShowForm(true)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            Create an Adoption Post
          </button>
        </div>
      ) : (
        <div className="npf-container">
          <div className="npf-form">
            <div className="npf-header">
              <h2 className="npf-title">Create New Post</h2>
              <button 
                className="npf-close-btn" 
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="npf-group">
              <label htmlFor="title" className="npf-label">
                Title
              </label>
              <input
                type="text"
                id="title"
                className="npf-input"
                placeholder="Enter post title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="npf-group">
              <label htmlFor="content" className="npf-label">
                Content
              </label>
              <textarea
                id="content"
                className="npf-textarea"
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
            </div>

            <div className="npf-row">
              <div className="npf-group">
                <label htmlFor="category" className="npf-label">
                  Category
                </label>
                <select
                  id="category"
                  className="npf-select"
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

              <div className="npf-group">
                <label htmlFor="district" className="npf-label">
                  District
                </label>
                <select
                  id="district"
                  className="npf-select"
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
              <div className="npf-images-section">
                <h3 className="npf-section-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  Images ({files.length}/{MAX_IMAGES})
                </h3>
                <div className="npf-images-grid">
                  {files.map((file, index) => (
                    <div key={`img-${index}`} className="npf-image-preview">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Image ${index + 1}`}
                      />
                      <button
                        type="button"
                        className="npf-remove-btn"
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

            <div className="npf-group">
              <label 
                htmlFor="fileInput" 
                className={`npf-file-label ${files.length >= MAX_IMAGES ? 'npf-file-label-disabled' : ''}`}
              >
                <svg
                  className="npf-upload-icon"
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
                {files.length >= MAX_IMAGES ? 'Maximum Images Reached' : `Add Photos (${files.length}/${MAX_IMAGES})`}
              </label>
              <input
                type="file"
                id="fileInput"
                className="npf-file-input"
                name="pics"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                disabled={files.length >= MAX_IMAGES}
              />
            </div>

            <button 
              type="button" 
              className="npf-submit-btn" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="npf-spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg>
                  Creating Post...
                </>
              ) : (
                "Create Post"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewPostForm;