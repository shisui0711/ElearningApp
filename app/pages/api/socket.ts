import type { Server as HTTPServer } from "http"
import type { Socket as NetSocket } from "net"
import type { NextApiRequest, NextApiResponse } from "next"
import type { Server as IOServer } from "socket.io"
import { Server } from "socket.io"

interface SocketServer extends HTTPServer {
  io?: IOServer | undefined
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

// Comment event types
interface JoinLessonRoomData {
  lessonId: string;
  userId: string;
}

interface JoinCourseRoomData {
  courseId: string;
  userId: string;
}

interface CommentData {
  lessonId: string;
  userId: string;
  content: string;
}

interface CourseCommentData {
  courseId: string;
  userId: string;
  content: string;
  parentId?: string | null;
}

const PORT = Number(process.env.PORT) || 3000

export async function GET(_req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (res.socket?.server?.io) {
    res.status(200).json({ success: true, message: "Socket is already running", socket: `:${PORT}` })
    return
  }

  console.log("Starting Socket.IO server on port:", PORT)

  const io = new Server({ path: "/api/socket", addTrailingSlash: false, cors: { origin: "*" } }).listen(PORT)

  io.on("connect", socket => {
    console.log("Socket connected:", socket.id)

    // Handle joining a lesson room
    socket.on("join_lesson", ({ lessonId }: JoinLessonRoomData) => {
      console.log(`User ${socket.id} joined lesson room: ${lessonId}`)
      socket.join(`lesson:${lessonId}`)
    })

    // Handle leaving a lesson room
    socket.on("leave_lesson", ({ lessonId }: { lessonId: string }) => {
      console.log(`User ${socket.id} left lesson room: ${lessonId}`)
      socket.leave(`lesson:${lessonId}`)
    })

    // Handle new comment
    socket.on("new_comment", (data: CommentData) => {
      console.log(`New comment in lesson ${data.lessonId} from user ${data.userId}`)
      // Broadcast to all users in the lesson room
      io.to(`lesson:${data.lessonId}`).emit("comment_received", data)
    })
    
    // Handle joining a course room
    socket.on("join_course", ({ courseId }: JoinCourseRoomData) => {
      console.log(`User ${socket.id} joined course room: ${courseId}`)
      socket.join(`course:${courseId}`)
    })

    // Handle leaving a course room
    socket.on("leave_course", ({ courseId }: { courseId: string }) => {
      console.log(`User ${socket.id} left course room: ${courseId}`)
      socket.leave(`course:${courseId}`)
    })

    // Handle new course comment
    socket.on("new_course_comment", (data: CourseCommentData) => {
      console.log(`New comment in course ${data.courseId} from user ${data.userId}`)
      // Broadcast to all users in the course room
      io.to(`course:${data.courseId}`).emit("course_comment_received", data)
    })

    socket.on("disconnect", async () => {
      console.log("Socket disconnected:", socket.id)
    })
  })

  res.socket.server.io = io
  res.status(201).json({ success: true, message: "Socket is started", socket: `:${PORT}` })
}