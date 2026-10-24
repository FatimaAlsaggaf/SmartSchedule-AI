// student-comments.js - FIXED VERSION
(function() {
  'use strict';

  const API_BASE = window.API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '')
    ? 'http://localhost:4000/api'
    : '/api';
  
  class StudentCommentManager {
      constructor() {
          this.currentCellInfo = null;
          this.studentData = null;
          this.userData = null;
      }
  
      init() {
          // Get user data
          const userStr = sessionStorage.getItem('user');
          const studentDataStr = localStorage.getItem('studentData');

          if (!userStr || !studentDataStr) {
              console.error('❌ No user or student data found');
              return;
          }

          try {
              this.userData = JSON.parse(userStr);
              this.studentData = JSON.parse(studentDataStr);
              console.log('✅ Comment system initialized');
              console.log('👤 Student ID:', this.studentData.student_id);
              console.log('📚 Student Level:', this.studentData.level);
              
              this.setupEventListeners();
          } catch (error) {
              console.error('❌ Error initializing comment system:', error);
          }
      }
  
      setupEventListeners() {
          console.log('🔧 Setting up event listeners...');
          
          // Save comment button
          const saveCommentBtn = document.getElementById('saveCommentBtn');
          if (saveCommentBtn) {
              // Remove any existing listeners
              const newBtn = saveCommentBtn.cloneNode(true);
              saveCommentBtn.parentNode.replaceChild(newBtn, saveCommentBtn);
              
              // Add new listener
              newBtn.addEventListener('click', () => {
                  console.log('💾 Save button clicked');
                  this.saveComment();
              });
              
              console.log('✅ Save button listener attached');
          } else {
              console.error('❌ Save button not found!');
          }

          // Clear form when modal closes
          const commentModal = document.getElementById('commentModal');
          if (commentModal) {
              commentModal.addEventListener('hidden.bs.modal', () => {
                  console.log('🔄 Modal closed, clearing form');
                  this.clearCommentForm();
              });
          }
      }
  
      /**
       * Open comment modal
       */
      openCommentModal(courseData) {
          console.log('📝 ========== OPENING MODAL ==========');
          console.log('📍 Received course data:', courseData);
          
          // Store course info
          this.currentCellInfo = {
              courseCode: courseData.courseCode,
              courseName: courseData.courseName,
              timeSlot: courseData.timeSlot,
              day: courseData.day
          };
          
          console.log('💾 Stored in currentCellInfo:', this.currentCellInfo);

          // Fill modal with course info
          document.getElementById('modalCourseName').textContent = 
              `${courseData.courseCode} - ${courseData.courseName}`;
          document.getElementById('modalTimeSlot').textContent = 
              courseData.timeSlot;
          document.getElementById('modalDay').textContent = 
              courseData.day;

          // Reset form
          this.clearCommentForm();
          
          // Show modal
          const modal = new bootstrap.Modal(document.getElementById('commentModal'));
          modal.show();
          
          console.log('✅ Modal opened successfully');
      }
  
      /**
       * Update comment template based on selected type
       */
      updateCommentTemplate(type) {
          console.log('🎨 Updating template for type:', type);
          
          const container = document.getElementById('commentFormContainer');
          const saveBtn = document.getElementById('saveCommentBtn');
          
          if (!type) {
              container.innerHTML = `
                  <div class="text-center text-muted py-4">
                      <i class="bi bi-arrow-up" style="font-size: 2rem;"></i>
                      <p>Please select a comment type above to continue</p>
                  </div>
              `;
              saveBtn.disabled = true;
              return;
          }

          let formHTML = '';

          if (type === 'conflict') {
              // ⚠️ Schedule Conflict - إكمال جملة
              formHTML = `
                  <div class="mb-3">
                      <h6 class="text-danger">⚠️ Schedule Conflict</h6>
                      <p class="text-muted">Complete the sentence below</p>
                  </div>
                  
                  <div class="sentence-template mb-4">
                      <p class="template-text">
                          I have a conflict with 
                          <input type="text" 
                                 class="blank-input" 
                                 id="conflictCourse" 
                                 placeholder="course code"
                                 maxlength="30"
                                 oninput="window.commentManager.validateConflictForm()">
                      </p>
                  </div>

                  <div class="preview-box" id="conflictPreview" style="display: none;">
                      <label class="form-label fw-bold">Preview:</label>
                      <div class="alert alert-light border" id="conflictPreviewText"></div>
                  </div>
              `;
          } else if (type === 'other') {
              // 💬 General Feedback - نص حر
              formHTML = `
                  <div class="mb-3">
                      <h6 class="text-primary">💬 General Feedback</h6>
                      <p class="text-muted">Share your feedback or suggestions</p>
                  </div>
                  
                  <div class="field-group">
                      <label for="generalFeedback" class="form-label fw-bold">
                          <i class="bi bi-chat-dots"></i> Your Feedback <span class="text-danger">*</span>
                      </label>
                      <textarea class="form-control form-control-lg" 
                                id="generalFeedback" 
                                rows="5" 
                                placeholder="Please share your feedback, suggestions, or concerns about this course schedule..."
                                maxlength="500"
                                oninput="window.commentManager.validateFeedbackForm()"></textarea>
                      <div class="text-end mt-1">
                          <small class="text-muted">
                              <span id="feedbackCharCount">0</span>/500 characters
                          </small>
                      </div>
                  </div>
              `;
          }

          container.innerHTML = formHTML;
          saveBtn.disabled = true;
          
          console.log('✅ Template updated');
      }
  
      /**
       * Validate conflict form
       */
      validateConflictForm() {
          const input = document.getElementById('conflictCourse');
          const saveBtn = document.getElementById('saveCommentBtn');
          const preview = document.getElementById('conflictPreview');
          const previewText = document.getElementById('conflictPreviewText');
          
          if (!input || !saveBtn) return;
          
          const value = input.value.trim();
          
          // Update preview
          if (value.length > 0) {
              preview.style.display = 'block';
              previewText.innerHTML = `I have a conflict with <strong>${value}</strong>`;
          } else {
              preview.style.display = 'none';
          }
          
          // Enable button if course code is entered (at least 3 characters)
          saveBtn.disabled = value.length < 3;
          
          // Visual feedback
          if (value.length >= 3) {
              input.classList.add('is-valid');
              input.classList.remove('is-invalid');
          } else if (value.length > 0) {
              input.classList.add('is-invalid');
              input.classList.remove('is-valid');
          } else {
              input.classList.remove('is-valid', 'is-invalid');
          }
      }
  
      /**
       * Validate feedback form
       */
      validateFeedbackForm() {
          const textarea = document.getElementById('generalFeedback');
          const saveBtn = document.getElementById('saveCommentBtn');
          const charCount = document.getElementById('feedbackCharCount');
          
          if (!textarea || !saveBtn) return;
          
          const value = textarea.value.trim();
          
          // Update character count
          if (charCount) {
              charCount.textContent = value.length;
          }
          
          // Enable button if feedback has at least 10 characters
          saveBtn.disabled = value.length < 10;
          
          // Visual feedback
          if (value.length >= 10) {
              textarea.classList.add('is-valid');
              textarea.classList.remove('is-invalid');
          } else if (value.length > 0) {
              textarea.classList.add('is-invalid');
              textarea.classList.remove('is-valid');
          } else {
              textarea.classList.remove('is-valid', 'is-invalid');
          }
      }
  
      /**
       * Save comment
       */
      async saveComment() {
          console.log('💾 ========== SAVING COMMENT ==========');
          console.log('📦 currentCellInfo:', this.currentCellInfo);
          console.log('👤 studentData:', this.studentData);
          
          // Validation 1: Check cell info
          if (!this.currentCellInfo) {
              console.error('❌ No currentCellInfo found!');
              alert('❌ Error: No course selected. Please close and try again.');
              return;
          }
          
          // Validation 2: Check student data
          if (!this.studentData || !this.studentData.student_id) {
              console.error('❌ No student data found!');
              alert('❌ Error: Student data not found. Please refresh the page.');
              return;
          }

          const typeSelect = document.getElementById('commentType');
          const type = typeSelect ? typeSelect.value : '';
          
          console.log('📝 Selected type:', type);
          
          if (!type) {
              alert('❌ Please select a comment type');
              return;
          }

          let finalComment = '';

          if (type === 'conflict') {
              // Get conflict course code
              const conflictCourse = document.getElementById('conflictCourse');
              const courseCode = conflictCourse ? conflictCourse.value.trim() : '';
              
              console.log('📚 Conflict course entered:', courseCode);
              
              if (!courseCode || courseCode.length < 3) {
                  alert('⚠️ Please enter a valid course code (at least 3 characters)');
                  conflictCourse?.focus();
                  return;
              }
              
              // Build conflict message
              finalComment = `I have a conflict with ${courseCode}`;
              
          } else if (type === 'other') {
              // Get general feedback
              const feedbackText = document.getElementById('generalFeedback');
              const feedback = feedbackText ? feedbackText.value.trim() : '';
              
              console.log('💭 Feedback entered length:', feedback.length);
              
              if (!feedback || feedback.length < 10) {
                  alert('⚠️ Please enter at least 10 characters for your feedback');
                  feedbackText?.focus();
                  return;
              }
              
              finalComment = feedback;
          }

          console.log('✍️ Final comment:', finalComment);

          const saveBtn = document.getElementById('saveCommentBtn');
          saveBtn.disabled = true;
          saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

          const requestBody = {
              student_id: this.studentData.student_id,
              course_code: this.currentCellInfo.courseCode,
              course_name: this.currentCellInfo.courseName,
              time_slot: this.currentCellInfo.timeSlot,
              day: this.currentCellInfo.day,
              comment_text: finalComment
          };

          console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
          console.log('🌐 API URL:', `${API_BASE}/comments`);
          console.log('🔑 Token:', sessionStorage.getItem('token') ? 'Present' : 'Missing');

          try {
              const response = await fetch(`${API_BASE}/comments`, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                  },
                  body: JSON.stringify(requestBody)
              });

              console.log('📥 Response status:', response.status);
              console.log('📥 Response ok:', response.ok);

              const data = await response.json();
              console.log('📥 Response data:', data);

              if (response.ok) {
                  console.log('✅ ========== SUCCESS ==========');
                  
                  // Success with styled alert
                  const alertDiv = document.createElement('div');
                  alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
                  alertDiv.style.zIndex = '9999';
                  alertDiv.innerHTML = `
                      <i class="bi bi-check-circle-fill me-2"></i>
                      <strong>Success!</strong> Your comment has been submitted successfully.
                      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                  `;
                  document.body.appendChild(alertDiv);
                  
                  setTimeout(() => alertDiv.remove(), 3000);
                  
                  // Close modal
                  const modal = bootstrap.Modal.getInstance(document.getElementById('commentModal'));
                  if (modal) {
                      modal.hide();
                  }

                  // Clear form
                  this.clearCommentForm();
              } else {
                  throw new Error(data.error || 'Failed to save comment');
              }
          } catch (error) {
              console.error('❌ ========== ERROR ==========');
              console.error('❌ Error details:', error);
              console.error('❌ Error message:', error.message);
              alert('❌ Failed to save comment: ' + error.message);
          } finally {
              saveBtn.disabled = false;
              saveBtn.innerHTML = '<i class="bi bi-send"></i> Submit Comment';
          }
      }
  
      /**
       * Clear form
       */
      clearCommentForm() {
          const typeSelect = document.getElementById('commentType');
          if (typeSelect) typeSelect.value = '';
          
          const container = document.getElementById('commentFormContainer');
          if (container) {
              container.innerHTML = `
                  <div class="text-center text-muted py-4">
                      <i class="bi bi-arrow-up" style="font-size: 2rem;"></i>
                      <p>Please select a comment type above to continue</p>
                  </div>
              `;
          }
          
          const saveBtn = document.getElementById('saveCommentBtn');
          if (saveBtn) saveBtn.disabled = true;
          
          // DON'T clear currentCellInfo here - it will be cleared when modal closes
          console.log('🧹 Form cleared (currentCellInfo preserved)');
      }
  }
  
  // Initialize
  const commentManager = new StudentCommentManager();
  
  // Make available globally BEFORE DOMContentLoaded
  window.commentManager = commentManager;
  
  document.addEventListener('DOMContentLoaded', () => {
      console.log('🚀 DOM Content Loaded - Initializing comment manager...');
      commentManager.init();
  });
  
  console.log('✅ student-comments.js loaded');
})();
