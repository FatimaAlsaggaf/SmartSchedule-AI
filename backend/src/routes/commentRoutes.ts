// backend/src/routes/commentRoutes.ts
import express, { Request, Response } from "express";
import { Comment, IComment } from "../db/models/Comment.js";
import { Student } from "../db/models/Student.js";
import Notification from "../db/models/Notification.js";
import { User } from "../db/models/User.js";
import mongoose from "mongoose";

const router = express.Router();

/**
 * POST /api/comments
 * Create a new comment from student
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { 
      student_id, 
      course_code, 
      course_name, 
      time_slot, 
      day, 
      comment_text 
    } = req.body;

    console.log('📝 [COMMENT] Received comment request:', {
      student_id,
      course_code,
      comment_length: comment_text?.length
    });

    if (!student_id || !course_code || !time_slot || !day || !comment_text) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields" 
      });
    }

    if (comment_text.trim().length < 5) {
      return res.status(400).json({ 
        success: false, 
        error: "Comment must be at least 5 characters" 
      });
    }

    // ✅ Find student
    const student = await Student.findOne({ student_id }).lean();
    console.log('👤 [COMMENT] Found student:', student ? 'Yes' : 'No');
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: "Student not found" 
      });
    }

    console.log('🔍 [COMMENT] Student user_id:', student.user_id, 'Type:', typeof student.user_id);

    // ✅ Try multiple ways to find the user
    let user = null;
    
    // Try 1: If user_id is a number, search by userID
    if (typeof student.user_id === 'number') {
      user = await User.findOne({ userID: student.user_id }).lean();
      console.log('🔍 [COMMENT] Search by userID (number):', user ? 'Found' : 'Not found');
    }
    
    // Try 2: If user_id is ObjectId string, search by _id
    if (!user && typeof student.user_id === 'string') {
      try {
        user = await User.findById(student.user_id).lean();
        console.log('🔍 [COMMENT] Search by _id (ObjectId):', user ? 'Found' : 'Not found');
      } catch (e) {
        console.log('⚠️ [COMMENT] Not a valid ObjectId');
      }
    }
    
    // Try 3: Search by userID if it's a string number
    if (!user && typeof student.user_id === 'string' && !isNaN(Number(student.user_id))) {
      user = await User.findOne({ userID: Number(student.user_id) }).lean();
      console.log('🔍 [COMMENT] Search by userID (string->number):', user ? 'Found' : 'Not found');
    }

    const studentName = user 
      ? `${user.First_Name} ${user.Last_Name}`.trim() 
      : student_id;

    console.log('✅ [COMMENT] Student name:', studentName);

    const comment = new Comment({
      student_id,
      student_name: studentName,
      student_level: student.level,
      course_code,
      course_name,
      time_slot,
      day,
      comment_text: comment_text.trim(),
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    });

    await comment.save();
    console.log('💾 [COMMENT] Comment saved:', comment._id);

    // ✅ Notify committee members using _id
    const committeeMembers = await User.find({ 
      role: { $in: ['Scheduler', 'LoadCommittee'] } 
    }).lean();

    console.log('👥 [COMMENT] Found committee members:', committeeMembers.length);

    if (committeeMembers.length > 0) {
      const notifications = committeeMembers.map(member => ({
        userId: member._id.toString(), // ✅ Use _id for notifications
        role: member.role,
        title: '💬 New Student Comment',
        message: `${studentName} (Level ${student.level}) commented on ${course_code}`,
        relatedId: comment._id.toString(),
        read: false,
        createdAt: new Date()
      }));

      await Notification.insertMany(notifications);
      console.log('📧 [COMMENT] Notifications sent:', notifications.length);
    }

    console.log(`✅ [COMMENT] Comment created successfully by ${student_id}`);

    res.status(201).json({ 
      success: true, 
      message: "Comment submitted successfully",
      data: comment 
    });
  } catch (error: any) {
    console.error("❌ [COMMENT] Error creating comment:", error);
    console.error("❌ [COMMENT] Error stack:", error.stack);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to create comment" 
    });
  }
});

/**
 * POST /api/comments/faculty
 * Create a comment from faculty/committee member
 */
router.post("/faculty", async (req: Request, res: Response) => {
  try {
    const { 
      faculty_id,
      faculty_name,
      faculty_role,
      course_code, 
      course_name, 
      time_slot, 
      day, 
      comment_text,
      level
    } = req.body;

    if (!faculty_id || !course_code || !time_slot || !day || !comment_text) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields" 
      });
    }

    if (comment_text.trim().length < 5) {
      return res.status(400).json({ 
        success: false, 
        error: "Comment must be at least 5 characters" 
      });
    }

    const comment = new Comment({
      student_id: `FACULTY_${faculty_id}`,
      student_name: `${faculty_name} (${faculty_role || 'Committee'})`,
      student_level: level || 4,
      course_code,
      course_name,
      time_slot,
      day,
      comment_text: comment_text.trim(),
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    });

    await comment.save();

    const committeeMembers = await User.find({ 
      role: { $in: ['Scheduler', 'LoadCommittee'] },
      _id: { $ne: faculty_id }
    }).lean();

    if (committeeMembers.length > 0) {
      const notifications = committeeMembers.map(member => ({
        userId: member._id.toString(),
        role: member.role,
        title: '💬 New Faculty Comment',
        message: `${faculty_name} commented on ${course_code} schedule`,
        relatedId: comment._id.toString(),
        read: false,
        createdAt: new Date()
      }));

      await Notification.insertMany(notifications);
    }

    console.log(`✅ Faculty comment created by ${faculty_name} for ${course_code}`);

    res.status(201).json({ 
      success: true, 
      message: "Comment submitted successfully",
      data: comment 
    });
  } catch (error: any) {
    console.error("❌ Error creating faculty comment:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to create comment" 
    });
  }
});

/**
 * GET /api/comments/student/:studentId
 */
router.get("/student/:studentId", async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const comments = await Comment.find({ student_id: studentId })
      .sort({ created_at: -1 })
      .lean();

    res.json({ 
      success: true, 
      data: comments,
      count: comments.length 
    });
  } catch (error: any) {
    console.error("❌ Error fetching student comments:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to fetch comments" 
    });
  }
});

/**
 * GET /api/comments/faculty/:facultyId
 */
router.get("/faculty/:facultyId", async (req: Request, res: Response) => {
  try {
    const { facultyId } = req.params;

    const comments = await Comment.find({ 
      student_id: `FACULTY_${facultyId}`
    })
      .sort({ created_at: -1 })
      .lean();

    res.json({ 
      success: true, 
      data: comments,
      count: comments.length 
    });
  } catch (error: any) {
    console.error("❌ Error fetching faculty comments:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to fetch comments" 
    });
  }
});

/**
 * GET /api/comments/level/:level
 */
router.get("/level/:level", async (req: Request, res: Response) => {
  try {
    const { level } = req.params;
    const { status } = req.query;

    const query: any = { student_level: parseInt(level) };
    if (status && status !== 'all') {
      query.status = status;
    }

    const comments = await Comment.find(query)
      .sort({ created_at: -1 })
      .lean();

    const summary = {
      total: comments.length,
      pending: comments.filter(c => c.status === 'pending').length,
      reviewed: comments.filter(c => c.status === 'reviewed').length,
      resolved: comments.filter(c => c.status === 'resolved').length
    };

    res.json({ 
      success: true, 
      data: comments,
      summary 
    });
  } catch (error: any) {
    console.error("❌ Error fetching level comments:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to fetch comments" 
    });
  }
});

/**
 * GET /api/comments/all
 */
router.get("/all", async (req: Request, res: Response) => {
  try {
    const { status, limit = 100 } = req.query;

    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const comments = await Comment.find(query)
      .sort({ created_at: -1 })
      .limit(parseInt(limit as string))
      .lean();

    const stats = {
      total: comments.length,
      by_status: {
        pending: comments.filter(c => c.status === 'pending').length,
        reviewed: comments.filter(c => c.status === 'reviewed').length,
        resolved: comments.filter(c => c.status === 'resolved').length
      },
      by_level: {} as Record<number, number>
    };

    comments.forEach(comment => {
      const level = comment.student_level;
      stats.by_level[level] = (stats.by_level[level] || 0) + 1;
    });

    res.json({ 
      success: true, 
      data: comments,
      stats 
    });
  } catch (error: any) {
    console.error("❌ Error fetching all comments:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to fetch comments" 
    });
  }
});

/**
 * PUT /api/comments/:id/status
 * ✅ FIXED VERSION - يدعم جميع أنواع user_id
 */
router.put("/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reviewed_by, procedures } = req.body;

    console.log('🔄 [UPDATE] Updating comment status:', { id, status, reviewed_by });

    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid status" 
      });
    }

    const updateData: any = {
      status,
      updated_at: new Date()
    };

    if (status === 'reviewed' || status === 'resolved') {
      updateData.reviewed_by = reviewed_by;
      updateData.reviewed_at = new Date();
    }

    // ✅ حفظ procedures
    if (procedures !== undefined) {
      updateData.procedures = procedures.trim();
    }

    const comment = await Comment.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ 
        success: false, 
        error: "Comment not found" 
      });
    }

    console.log('✅ [UPDATE] Comment updated successfully');

    // ✅ Notify student if resolved (not faculty)
    if (status === 'resolved' && !comment.student_id.startsWith('FACULTY_')) {
      console.log('📧 [UPDATE] Sending notification to student...');
      
      const student = await Student.findOne({ 
        student_id: comment.student_id 
      }).lean();
      
      if (student) {
        console.log('👤 [UPDATE] Student found:', student.student_id);
        console.log('🔍 [UPDATE] Student user_id:', student.user_id, 'Type:', typeof student.user_id);
        
        // ✅ البحث عن User حسب نوع user_id
        let user = null;
        
        // Try 1: If user_id is a number, search by userID
        if (typeof student.user_id === 'number') {
          user = await User.findOne({ userID: student.user_id }).lean();
          console.log('🔍 [UPDATE] Search by userID (number):', user ? 'Found' : 'Not found');
        }
        
        // Try 2: If user_id is ObjectId string, search by _id
        if (!user && typeof student.user_id === 'string') {
          try {
            user = await User.findById(student.user_id).lean();
            console.log('🔍 [UPDATE] Search by _id (ObjectId):', user ? 'Found' : 'Not found');
          } catch (e) {
            console.log('⚠️ [UPDATE] Not a valid ObjectId');
          }
        }
        
        // Try 3: Search by userID if it's a string number
        if (!user && typeof student.user_id === 'string' && !isNaN(Number(student.user_id))) {
          user = await User.findOne({ userID: Number(student.user_id) }).lean();
          console.log('🔍 [UPDATE] Search by userID (string->number):', user ? 'Found' : 'Not found');
        }
        
        if (user) {
          await Notification.create({
            userId: user._id.toString(), // ✅ Use _id for notification
            role: 'Student',
            title: '✅ Comment Resolved',
            message: `Your comment on ${comment.course_code} has been resolved`,
            relatedId: comment._id.toString(),
            read: false,
            createdAt: new Date()
          });
          console.log('✅ [UPDATE] Notification sent to:', user._id);
        } else {
          console.log('⚠️ [UPDATE] User not found for student:', student.student_id);
        }
      } else {
        console.log('⚠️ [UPDATE] Student not found:', comment.student_id);
      }
    }

    console.log(`✅ Comment ${id} status updated to ${status}`);

    res.json({ 
      success: true, 
      message: "Comment updated successfully",
      data: comment 
    });
  } catch (error: any) {
    console.error("❌ [UPDATE] Error updating comment:", error);
    console.error("❌ [UPDATE] Error message:", error.message);
    console.error("❌ [UPDATE] Error stack:", error.stack);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to update comment" 
    });
  }
});

/**
 * DELETE /api/comments/:id
 * Delete a comment by its ID
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // التأكد أن الـ ID صحيح (اختياري لكن مفضل)
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ 
            success: false, 
            error: "Invalid comment ID format" 
        });
    }

    const deletedComment = await Comment.findByIdAndDelete(id);

    if (!deletedComment) {
      return res.status(404).json({ 
        success: false, 
        error: "Comment not found" 
      });
    }

    console.log(`✅ Comment ${id} deleted successfully`);

    res.json({ 
      success: true, 
      message: "Comment deleted successfully" 
    });

  } catch (error: any) {
    console.error("❌ Error deleting comment:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to delete comment" 
    });
  }
});

console.log("[COMMENTS API] Routes loaded successfully");

export default router;
