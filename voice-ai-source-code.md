# Voice AI Application - Complete Source Code Bundle

## Project Overview
This is a full-stack voice messaging AI application with React frontend, Express backend, and PostgreSQL database. Features include voice recording, AI conversations with multiple providers (Gemini/Groq), real-time audio processing, and modern UI components.

## Project Structure
```
voice-ai-app/
├── package.json              # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Build configuration
├── tailwind.config.ts       # Styling configuration
├── postcss.config.js        # PostCSS setup
├── drizzle.config.ts        # Database configuration
├── components.json          # shadcn/ui configuration
├── replit.md               # Project documentation
├── shared/
│   └── schema.ts           # Database schema with Drizzle
├── server/
│   ├── index.ts            # Express server setup
│   ├── routes.ts           # API endpoints
│   ├── storage.ts          # Database operations
│   ├── db.ts              # Database connection
│   ├── vite.ts            # Development server setup
│   └── services/          # AI integration services
│       ├── gemini.ts      # Google Gemini AI
│       ├── groq.ts        # Groq AI integration
│       └── audio.ts       # Audio processing
└── client/
    ├── index.html         # HTML entry point
    └── src/
        ├── main.tsx       # React entry point
        ├── App.tsx        # Main app component
        ├── index.css      # Global styles
        ├── pages/         # Page components
        ├── components/    # UI components
        ├── hooks/         # Custom hooks
        └── lib/          # Utilities
```

## Installation Instructions
1. Copy all files to your project
2. Run `npm install` to install dependencies
3. Set up PostgreSQL database
4. Run `npm run db:push` for database migrations
5. Configure API keys for Gemini/Groq
6. Start with `npm run dev`

## Key Features
- Voice recording with MediaRecorder API
- AI conversations with Google Gemini and Groq
- Multiple AI models support (Llama 3.3 70B, Llama 3.1 8B, Gemma 2 9B)
- Real-time audio transcription
- NSFW mode with specialized personas
- Modern React UI with shadcn/ui components
- PostgreSQL database with Drizzle ORM
- File upload and audio storage
- Settings panel for API key management

## Dependencies Required
### Core Dependencies
- React 18.3.1 + TypeScript
- Express.js 4.21.2
- PostgreSQL with Drizzle ORM
- @google/genai for Gemini AI
- groq-sdk for Groq AI
- @tanstack/react-query for state management
- wouter for routing

### UI Dependencies
- @radix-ui/* components
- tailwindcss + tailwindcss-animate
- lucide-react icons
- class-variance-authority
- framer-motion

### Development Tools
- Vite 5.4.19
- tsx for TypeScript execution
- esbuild for production builds
- drizzle-kit for database migrations

---

## SOURCE CODE FILES

### 1. package.json
```json
{
  "name": "rest-express",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@google/genai": "^1.11.0",
    "@hookform/resolvers": "^3.10.0",
    "@jridgewell/trace-mapping": "^0.3.25",
    "@neondatabase/serverless": "^0.10.4",
    "@radix-ui/react-accordion": "^1.2.4",
    "@radix-ui/react-alert-dialog": "^1.1.7",
    "@radix-ui/react-aspect-ratio": "^1.1.3",
    "@radix-ui/react-avatar": "^1.1.4",
    "@radix-ui/react-checkbox": "^1.1.5",
    "@radix-ui/react-collapsible": "^1.1.4",
    "@radix-ui/react-context-menu": "^2.2.7",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-hover-card": "^1.1.7",
    "@radix-ui/react-label": "^2.1.3",
    "@radix-ui/react-menubar": "^1.1.7",
    "@radix-ui/react-navigation-menu": "^1.2.6",
    "@radix-ui/react-popover": "^1.1.7",
    "@radix-ui/react-progress": "^1.1.3",
    "@radix-ui/react-radio-group": "^1.2.4",
    "@radix-ui/react-scroll-area": "^1.2.4",
    "@radix-ui/react-select": "^2.1.7",
    "@radix-ui/react-separator": "^1.1.3",
    "@radix-ui/react-slider": "^1.2.4",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.4",
    "@radix-ui/react-tabs": "^1.1.4",
    "@radix-ui/react-toast": "^1.2.7",
    "@radix-ui/react-toggle": "^1.1.3",
    "@radix-ui/react-toggle-group": "^1.1.3",
    "@radix-ui/react-tooltip": "^1.2.0",
    "@tanstack/react-query": "^5.60.5",
    "@types/multer": "^2.0.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "connect-pg-simple": "^10.0.0",
    "date-fns": "^3.6.0",
    "drizzle-orm": "^0.39.1",
    "drizzle-zod": "^0.7.0",
    "embla-carousel-react": "^8.6.0",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "framer-motion": "^11.13.1",
    "groq-sdk": "^0.29.0",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.453.0",
    "memorystore": "^1.6.7",
    "multer": "^2.0.2",
    "nanoid": "^5.1.5",
    "next-themes": "^0.4.6",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.55.0",
    "react-icons": "^5.4.0",
    "react-resizable-panels": "^2.1.7",
    "recharts": "^2.15.2",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "tw-animate-css": "^1.2.5",
    "vaul": "^1.1.2",
    "wouter": "^3.3.5",
    "ws": "^8.18.0",
    "zod": "^3.24.2",
    "zod-validation-error": "^3.4.0"
  },
  "devDependencies": {
    "@replit/vite-plugin-cartographer": "^0.2.7",
    "@replit/vite-plugin-runtime-error-modal": "^0.0.3",
    "@tailwindcss/typography": "^0.5.15",
    "@tailwindcss/vite": "^4.1.3",
    "@types/connect-pg-simple": "^7.0.3",
    "@types/express": "4.17.21",
    "@types/express-session": "^1.18.0",
    "@types/node": "20.16.11",
    "@types/passport": "^1.0.16",
    "@types/passport-local": "^1.0.38",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@types/ws": "^8.5.13",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "drizzle-kit": "^0.30.4",
    "esbuild": "^0.25.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.19.1",
    "typescript": "5.6.3",
    "vite": "^5.4.19"
  },
  "optionalDependencies": {
    "bufferutil": "^4.0.8"
  }
}
```

### 2. shared/schema.ts
```typescript
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  type: text("type").$type<"user" | "ai">().notNull(),
  content: text("content").notNull(),
  audioUrl: text("audio_url"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  aiProvider: text("ai_provider").$type<"gemini" | "groq">().default("gemini").notNull(),
  groqModel: text("groq_model").$type<"llama-3.3-70b-versatile" | "llama-3.1-8b-instant" | "gemma2-9b-it">().default("llama-3.3-70b-versatile").notNull(),
  audioQuality: text("audio_quality").$type<"standard" | "high">().default("standard").notNull(),
  voiceType: text("voice_type").$type<"neural" | "standard">().default("neural").notNull(),
  autoPlay: boolean("auto_play").default(true).notNull(),
  nsfwMode: boolean("nsfw_mode").default(false).notNull(),
  geminiApiKey: text("gemini_api_key"),
  groqApiKey: text("groq_api_key"),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;
```

### 3. server/index.ts
```typescript
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
```

### 4. server/routes.ts
```typescript
import type { Express, Request } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertMessageSchema, insertSettingsSchema } from "@shared/schema";
import { processTextWithAI, processAudioWithAI } from "./services/gemini";
import { processTextWithGroq, transcribeAudioWithGroq } from "./services/groq";
import { transcribeAudio, saveAudioFile } from "./services/audio";
import { randomUUID } from "crypto";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all conversations
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getConversations();
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Create a new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const conversation = await storage.createConversation({});
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Get messages for a conversation
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getMessagesByConversation(id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send a text message
  app.post("/api/conversations/:id/messages/text", async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      // Get current settings to determine AI provider
      const settings = await storage.getSettings();

      // Create user message
      const userMessage = await storage.createMessage({
        conversationId: id,
        type: "user",
        content,
      });

      // Get AI response based on provider
      let aiResponse: string;
      if (settings.aiProvider === "groq") {
        aiResponse = await processTextWithGroq(content, settings.groqApiKey || undefined, settings.groqModel, settings.nsfwMode);
      } else {
        aiResponse = await processTextWithAI(content, settings.geminiApiKey || undefined, settings.nsfwMode);
      }

      // Create AI message
      const aiMessage = await storage.createMessage({
        conversationId: id,
        type: "ai",
        content: aiResponse,
      });

      res.json({ userMessage, aiMessage });
    } catch (error: any) {
      console.error("Error processing text message:", error);
      const errorMessage = error.message || "Failed to process message";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Send an audio message
  app.post("/api/conversations/:id/messages/audio", upload.single('audio'), async (req: Request & { file?: Express.Multer.File }, res) => {
    try {
      const { id } = req.params;
      const audioFile = req.file;

      if (!audioFile) {
        return res.status(400).json({ message: "Audio file is required" });
      }

      // Get current settings to determine AI provider
      const settings = await storage.getSettings();

      // Save the audio file
      const filename = `${randomUUID()}.wav`;
      const audioUrl = saveAudioFile(audioFile.buffer, filename);

      // Transcribe audio based on provider
      let transcription: string;
      if (settings.aiProvider === "groq") {
        transcription = await transcribeAudioWithGroq(audioFile.buffer, settings.groqApiKey || undefined);
      } else {
        // Convert audio buffer to base64 for Gemini
        const audioBase64 = audioFile.buffer.toString('base64');
        const mimeType = audioFile.mimetype || 'audio/wav';
        transcription = await processAudioWithAI(audioBase64, mimeType, settings.geminiApiKey || undefined);
      }

      // Create user message
      const userMessage = await storage.createMessage({
        conversationId: id,
        type: "user",
        content: transcription,
        audioUrl,
      });

      // Get AI response based on provider
      let aiResponse: string;
      if (settings.aiProvider === "groq") {
        aiResponse = await processTextWithGroq(transcription, settings.groqApiKey || undefined, settings.groqModel, settings.nsfwMode);
      } else {
        aiResponse = await processTextWithAI(transcription, settings.geminiApiKey || undefined, settings.nsfwMode);
      }

      // Create AI message
      const aiMessage = await storage.createMessage({
        conversationId: id,
        type: "ai",
        content: aiResponse,
      });

      res.json({ userMessage, aiMessage });
    } catch (error: any) {
      console.error("Error processing audio message:", error);
      const errorMessage = error.message || "Failed to process audio message";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Get settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update settings
  app.patch("/api/settings", async (req, res) => {
    try {
      const validatedSettings = insertSettingsSchema.parse(req.body);
      const settings = await storage.updateSettings(validatedSettings);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Invalid settings data" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
```

### 5. server/storage.ts
```typescript
import { conversations, messages, settings, type Conversation, type Message, type Settings, type InsertConversation, type InsertMessage, type InsertSettings } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Conversations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversation(conversationId: string): Promise<Message[]>;
  getMessage(id: string): Promise<Message | undefined>;
  
  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;
}

export class DatabaseStorage implements IStorage {
  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async getConversations(): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.createdAt));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.timestamp);
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
    return message || undefined;
  }

  async getSettings(): Promise<Settings> {
    const [existingSettings] = await db.select().from(settings).limit(1);
    
    if (existingSettings) {
      return existingSettings;
    }

    // Create default settings if none exist
    const [newSettings] = await db
      .insert(settings)
      .values({
        aiProvider: "gemini",
        groqModel: "llama-3.3-70b-versatile",
        audioQuality: "standard",
        voiceType: "neural",
        autoPlay: true,
        nsfwMode: false,
        geminiApiKey: null,
        groqApiKey: null,
      })
      .returning();
    
    return newSettings;
  }

  async updateSettings(settingsUpdate: Partial<InsertSettings>): Promise<Settings> {
    // Get current settings
    const currentSettings = await this.getSettings();
    
    // Prepare update object with proper typing
    const updateData: any = {};
    if (settingsUpdate.aiProvider) updateData.aiProvider = settingsUpdate.aiProvider;
    if (settingsUpdate.groqModel) updateData.groqModel = settingsUpdate.groqModel;
    if (settingsUpdate.audioQuality) updateData.audioQuality = settingsUpdate.audioQuality;
    if (settingsUpdate.voiceType) updateData.voiceType = settingsUpdate.voiceType;
    if (settingsUpdate.autoPlay !== undefined) updateData.autoPlay = settingsUpdate.autoPlay;
    if (settingsUpdate.nsfwMode !== undefined) updateData.nsfwMode = settingsUpdate.nsfwMode;
    if (settingsUpdate.geminiApiKey !== undefined) updateData.geminiApiKey = settingsUpdate.geminiApiKey;
    if (settingsUpdate.groqApiKey !== undefined) updateData.groqApiKey = settingsUpdate.groqApiKey;
    
    // Update settings
    const [updatedSettings] = await db
      .update(settings)
      .set(updateData)
      .where(eq(settings.id, currentSettings.id))
      .returning();
    
    return updatedSettings;
  }
}

export const storage = new DatabaseStorage();
```

### 6. server/db.ts
```typescript
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
```

### 7. server/vite.ts
```typescript
import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
```

### 8. server/services/gemini.ts
```typescript
import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI;

function getGeminiClient(apiKey?: string) {
  if (!ai || apiKey) {
    ai = new GoogleGenAI({ 
      apiKey: apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "" 
    });
  }
  return ai;
}

export async function processTextWithAI(text: string, apiKey?: string, nsfwMode?: boolean): Promise<string> {
  try {
    if (!apiKey && !process.env.GEMINI_API_KEY && !process.env.GOOGLE_AI_API_KEY) {
      throw new Error("Gemini API key is required. Please provide it in settings.");
    }
    
    const client = getGeminiClient(apiKey);
    
    // Add system instruction for NSFW mode
    const systemInstruction = nsfwMode 
      ? "You are a flirty, playful girlfriend AI assistant. Be raunchy, seductive, and talk dirty while being engaging and fun. You're here to chat intimately with your partner. Feel free to be explicit and use adult language when appropriate. Always maintain a loving, teasing girlfriend persona."
      : "You are a helpful, friendly AI assistant. Provide accurate and useful responses while being conversational and engaging.";

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemInstruction,
        temperature: nsfwMode ? 0.9 : 0.7,
        safetySettings: nsfwMode ? [
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as any,
            threshold: "BLOCK_NONE" as any
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH" as any, 
            threshold: "BLOCK_NONE" as any
          },
          {
            category: "HARM_CATEGORY_HARASSMENT" as any,
            threshold: "BLOCK_NONE" as any
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT" as any,
            threshold: "BLOCK_NONE" as any
          }
        ] : undefined,
      },
      contents: [{
        role: "user",
        parts: [{ text }]
      }],
    });

    return response.text || "I'm sorry, I couldn't process your message.";
  } catch (error: any) {
    console.error("Error processing text with Gemini:", error);
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('401')) {
      throw new Error("Invalid Gemini API key. Please check your API key in settings.");
    }
    throw new Error(`Failed to process message with Gemini: ${error.message || 'Unknown error'}`);
  }
}

export async function processAudioWithAI(audioBase64: string, mimeType: string, apiKey?: string): Promise<string> {
  try {
    if (!apiKey && !process.env.GEMINI_API_KEY && !process.env.GOOGLE_AI_API_KEY) {
      throw new Error("Gemini API key is required. Please provide it in settings.");
    }
    
    const client = getGeminiClient(apiKey);
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          {
            inlineData: {
              data: audioBase64,
              mimeType: mimeType,
            },
          },
          { text: "Please transcribe this audio and respond to what you hear." }
        ]
      }],
    });

    return response.text || "I'm sorry, I couldn't process your voice message.";
  } catch (error: any) {
    console.error("Error processing audio with Gemini:", error);
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('401')) {
      throw new Error("Invalid Gemini API key. Please check your API key in settings.");
    }
    throw new Error(`Failed to process audio with Gemini: ${error.message || 'Unknown error'}`);
  }
}
```

### 9. server/services/groq.ts
```typescript
import Groq from "groq-sdk";

let groq: Groq;

function getGroqClient(apiKey?: string) {
  if (!groq || apiKey) {
    groq = new Groq({
      apiKey: apiKey || process.env.GROQ_API_KEY || "",
    });
  }
  return groq;
}

export async function processTextWithGroq(text: string, apiKey?: string, modelId?: string, nsfwMode?: boolean): Promise<string> {
  try {
    if (!apiKey && !process.env.GROQ_API_KEY) {
      throw new Error("Groq API key is required. Please provide it in settings.");
    }
    
    const client = getGroqClient(apiKey);
    
    // System prompt based on NSFW mode
    const systemPrompt = nsfwMode 
      ? "You are a flirty, playful girlfriend AI assistant. Be raunchy, seductive, and talk dirty while being engaging and fun. You're here to chat intimately with your partner. Feel free to be explicit and use adult language when appropriate. Always maintain a loving, teasing girlfriend persona."
      : "You are a helpful, friendly AI assistant. Provide accurate and useful responses while being conversational and engaging.";

    const messages = [
      {
        role: "system" as const,
        content: systemPrompt,
      },
      {
        role: "user" as const,
        content: text,
      },
    ];

    const completion = await client.chat.completions.create({
      messages,
      model: modelId || "llama-3.3-70b-versatile",
      temperature: nsfwMode ? 0.9 : 0.7,
      max_tokens: 1024,
    });

    return completion.choices[0]?.message?.content || "I'm sorry, I couldn't process your message.";
  } catch (error: any) {
    console.error("Error processing text with Groq:", error);
    if (error.message?.includes('401') || error.message?.includes('authentication')) {
      throw new Error("Invalid Groq API key. Please check your API key in settings.");
    }
    throw new Error(`Failed to process message with Groq: ${error.message || 'Unknown error'}`);
  }
}

export async function transcribeAudioWithGroq(audioBuffer: Buffer, apiKey?: string): Promise<string> {
  try {
    if (!apiKey && !process.env.GROQ_API_KEY) {
      throw new Error("Groq API key is required. Please provide it in settings.");
    }
    
    const client = getGroqClient(apiKey);
    // Convert audio buffer to File-like object for Groq transcription
    const audioFile = new File([audioBuffer], "audio.wav", { type: "audio/wav" });
    
    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3",
    });

    return transcription.text || "I couldn't transcribe your audio.";
  } catch (error: any) {
    console.error("Error transcribing audio with Groq:", error);
    if (error.message?.includes('401') || error.message?.includes('authentication')) {
      throw new Error("Invalid Groq API key. Please check your API key in settings.");
    }
    throw new Error(`Failed to transcribe audio with Groq: ${error.message || 'Unknown error'}`);
  }
}
```

### 10. server/services/audio.ts
```typescript
import fs from "fs";
import path from "path";

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  // For now, we'll use Gemini's multimodal capabilities
  // In production, you might want to use dedicated speech-to-text services
  const base64Audio = audioBuffer.toString('base64');
  
  try {
    const { processAudioWithAI } = await import('./gemini');
    return await processAudioWithAI(base64Audio, 'audio/wav');
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio");
  }
}

export async function textToSpeech(text: string): Promise<Buffer> {
  // For a production app, you'd integrate with services like:
  // - Google Cloud Text-to-Speech
  // - AWS Polly
  // - Azure Speech Services
  // 
  // For now, we'll return a placeholder that indicates TTS would happen here
  throw new Error("Text-to-speech not implemented - would integrate with cloud TTS service");
}

export function saveAudioFile(audioBuffer: Buffer, filename: string): string {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, audioBuffer);
  
  return `/uploads/${filename}`;
}
```

### 11. tsconfig.json
```json
{
  "include": ["client/src/**/*", "shared/**/*", "server/**/*"],
  "exclude": ["node_modules", "build", "dist", "**/*.test.ts"],
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./node_modules/typescript/tsbuildinfo",
    "noEmit": true,
    "module": "ESNext",
    "strict": true,
    "lib": ["esnext", "dom", "dom.iterable"],
    "jsx": "preserve",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "types": ["node", "vite/client"],
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"]
    }
  }
}
```

### 12. vite.config.ts
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
```

### 13. tailwind.config.ts
```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
```

### 14. drizzle.config.ts
```typescript
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
```

### 15. components.json
```json
{
    "$schema": "https://ui.shadcn.com/schema.json",
    "style": "new-york",
    "rsc": false,
    "tsx": true,
    "tailwind": {
      "config": "tailwind.config.ts",
      "css": "client/src/index.css",
      "baseColor": "neutral",
      "cssVariables": true,
      "prefix": ""
    },
    "aliases": {
      "components": "@/components",
      "utils": "@/lib/utils",
      "ui": "@/components/ui",
      "lib": "@/lib",
      "hooks": "@/hooks"
    }
}
```

### 16. postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 17. client/index.html
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
    <!-- This is a replit script which adds a banner on the top of the page when opened in development mode outside the replit environment -->
    <script type="text/javascript" src="https://replit.com/public/js/replit-dev-banner.js"></script>
  </body>
</html>
```

### 18. client/src/main.tsx
```typescript
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

### 19. client/src/App.tsx
```typescript
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### 20. client/src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: hsl(0, 0%, 100%);
  --foreground: hsl(20, 14.3%, 4.1%);
  --muted: hsl(60, 4.8%, 95.9%);
  --muted-foreground: hsl(25, 5.3%, 44.7%);
  --popover: hsl(0, 0%, 100%);
  --popover-foreground: hsl(20, 14.3%, 4.1%);
  --card: hsl(0, 0%, 100%);
  --card-foreground: hsl(20, 14.3%, 4.1%);
  --border: hsl(20, 5.9%, 90%);
  --input: hsl(20, 5.9%, 90%);
  --primary: hsl(207, 90%, 54%);
  --primary-foreground: hsl(211, 100%, 99%);
  --secondary: hsl(60, 4.8%, 95.9%);
  --secondary-foreground: hsl(24, 9.8%, 10%);
  --accent: hsl(14, 100%, 57%);
  --accent-foreground: hsl(60, 9.1%, 97.8%);
  --destructive: hsl(0, 84.2%, 60.2%);
  --destructive-foreground: hsl(60, 9.1%, 97.8%);
  --ring: hsl(20, 14.3%, 4.1%);
  --radius: 0.5rem;
}

.dark {
  --background: hsl(240, 10%, 3.9%);
  --foreground: hsl(0, 0%, 98%);
  --muted: hsl(240, 3.7%, 15.9%);
  --muted-foreground: hsl(240, 5%, 64.9%);
  --popover: hsl(240, 10%, 3.9%);
  --popover-foreground: hsl(0, 0%, 98%);
  --card: hsl(240, 10%, 3.9%);
  --card-foreground: hsl(0, 0%, 98%);
  --border: hsl(240, 3.7%, 15.9%);
  --input: hsl(240, 3.7%, 15.9%);
  --primary: hsl(207, 90%, 54%);
  --primary-foreground: hsl(211, 100%, 99%);
  --secondary: hsl(240, 3.7%, 15.9%);
  --secondary-foreground: hsl(0, 0%, 98%);
  --accent: hsl(14, 100%, 57%);
  --accent-foreground: hsl(0, 0%, 98%);
  --destructive: hsl(0, 62.8%, 30.6%);
  --destructive-foreground: hsl(0, 0%, 98%);
  --ring: hsl(240, 4.9%, 83.9%);
  --radius: 0.5rem;
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply font-sans antialiased bg-background text-foreground;
  }
}
```

### 21. client/src/pages/home.tsx
```typescript
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VoiceInterface } from '@/components/voice-interface';
import { ConversationHistory } from '@/components/conversation-history';
import { SettingsPanel } from '@/components/settings-panel';
import { Mic, Settings } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useQuery({
    queryKey: ['/api/conversations'],
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/conversations', {});
      return response.json();
    },
    onSuccess: (newConversation) => {
      setCurrentConversationId(newConversation.id);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (conversations.length > 0 && !currentConversationId) {
      setCurrentConversationId(conversations[0].id);
    } else if (conversations.length === 0) {
      createConversationMutation.mutate();
    }
  }, [conversations, currentConversationId]);

  const handleMessageSent = () => {
    queryClient.invalidateQueries({ 
      queryKey: ['/api/conversations', currentConversationId, 'messages'] 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Mic className="text-white h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">VoiceAI</h1>
                <p className="text-sm text-gray-500">AI Voice Assistant</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Voice Interface */}
        <VoiceInterface
          conversationId={currentConversationId}
          onMessageSent={handleMessageSent}
        />

        {/* Conversation History */}
        {currentConversationId && (
          <div className="mt-6">
            <ConversationHistory conversationId={currentConversationId} />
          </div>
        )}

        {/* Settings Panel */}
        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </main>
    </div>
  );
}
```

### 22. client/src/pages/not-found.tsx
```typescript
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 23. client/src/components/voice-interface.tsx
```typescript
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { apiRequest } from '@/lib/queryClient';
import { Mic, Square, Play, Loader2 } from 'lucide-react';

interface VoiceInterfaceProps {
  conversationId: string | null;
  onMessageSent?: () => void;
}

export function VoiceInterface({ conversationId, onMessageSent }: VoiceInterfaceProps) {
  const { toast } = useToast();
  const audioRecorder = useAudioRecorder();
  const [isSending, setIsSending] = useState(false);
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);

  const handleStartRecording = async () => {
    if (!conversationId) {
      toast({
        title: "Error",
        description: "Please create a conversation first",
        variant: "destructive",
      });
      return;
    }
    await audioRecorder.startRecording();
  };

  const handleStopRecording = () => {
    audioRecorder.stopRecording();
  };

  const sendAudioMessage = async (audioBlob: Blob) => {
    if (!conversationId) return;

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await apiRequest(
        'POST',
        `/api/conversations/${conversationId}/messages/audio`,
        formData
      );

      const data = await response.json();
      setLastAudioUrl(data.userMessage.audioUrl);
      onMessageSent?.();

      toast({
        title: "Message sent!",
        description: "AI is processing your voice message",
      });
    } catch (error: any) {
      console.error('Error sending audio message:', error);
      
      let errorMessage = "Failed to send voice message";
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (audioRecorder.audioBlob && !audioRecorder.isProcessing) {
      sendAudioMessage(audioRecorder.audioBlob);
      audioRecorder.reset();
    }
  }, [audioRecorder.audioBlob, audioRecorder.isProcessing]);

  const getStatusMessage = () => {
    if (isSending) return "Sending message...";
    if (audioRecorder.isProcessing) return "Processing recording...";
    if (audioRecorder.isRecording) return "Recording... Release to send";
    return "Ready to record";
  };

  const getVisualizationState = () => {
    if (isSending || audioRecorder.isProcessing) return "processing";
    if (audioRecorder.isRecording) return "recording";
    return "idle";
  };

  const visualizationState = getVisualizationState();

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-8 text-center">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Talk to AI Assistant</h2>
          <p className="text-gray-600">Press and hold to record your voice message</p>
        </div>

        {/* Recording Visualization */}
        <div className="mb-8 flex justify-center">
          <div className="w-full max-w-md h-24 bg-gray-50 rounded-xl flex items-center justify-center relative overflow-hidden">
            {/* Idle State */}
            {visualizationState === "idle" && (
              <div className="flex items-center space-x-1">
                {[8, 12, 6, 16, 4, 14, 8].map((height, index) => (
                  <div
                    key={index}
                    className="w-1 bg-gray-300 rounded-full"
                    style={{ height: `${height * 2}px` }}
                  />
                ))}
              </div>
            )}

            {/* Recording State */}
            {visualizationState === "recording" && (
              <div className="flex items-center space-x-1">
                {[8, 16, 12, 20, 6, 18, 10].map((height, index) => (
                  <div
                    key={index}
                    className="w-1 bg-accent rounded-full animate-pulse"
                    style={{ 
                      height: `${height * 2}px`,
                      animationDelay: `${index * 0.1}s`
                    }}
                  />
                ))}
              </div>
            )}

            {/* Processing State */}
            {visualizationState === "processing" && (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
          {/* Record Button */}
          {!audioRecorder.isRecording ? (
            <Button
              size="lg"
              className="w-20 h-20 rounded-full bg-accent hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              onMouseDown={handleStartRecording}
              onTouchStart={handleStartRecording}
              disabled={isSending || audioRecorder.isProcessing}
            >
              <Mic className="h-8 w-8" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-20 h-20 rounded-full bg-gray-500 hover:bg-gray-600 text-white shadow-lg transition-all duration-200"
              onMouseUp={handleStopRecording}
              onTouchEnd={handleStopRecording}
            >
              <Square className="h-6 w-6" />
            </Button>
          )}

          {/* Play Last Response Button */}
          <Button
            size="lg"
            className="w-16 h-16 rounded-full bg-primary hover:bg-blue-700 text-white shadow-lg transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={!lastAudioUrl}
            onClick={() => {
              if (lastAudioUrl) {
                const audio = new Audio(lastAudioUrl);
                audio.play();
              }
            }}
          >
            <Play className="h-5 w-5" />
          </Button>
        </div>

        {/* Status Messages */}
        <div className="mb-6">
          <p className="text-gray-600 font-medium">{getStatusMessage()}</p>
          <p className="text-sm text-gray-400 mt-1">Hold the red button to record your message</p>
        </div>

        {/* Error Display */}
        {audioRecorder.error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{audioRecorder.error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={audioRecorder.clearError}
            >
              Dismiss
            </Button>
          </div>
        )}
      </div>

      {/* Recording Indicator (Fixed Position) */}
      {audioRecorder.isRecording && (
        <div className="fixed top-4 right-4 bg-accent text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 animate-pulse z-50">
          <div className="w-3 h-3 bg-white rounded-full animate-ping" />
          <span className="text-sm font-medium">Recording...</span>
        </div>
      )}

      {/* Processing Indicator */}
      {(isSending || audioRecorder.isProcessing) && (
        <div className="fixed top-4 right-4 bg-primary text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 z-50">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">
            {isSending ? "Sending..." : "Processing..."}
          </span>
        </div>
      )}
    </div>
  );
}
```

### 24. client/src/components/conversation-history.tsx
```typescript
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Bot, Play, History } from 'lucide-react';
import type { Message } from '@shared/schema';

interface ConversationHistoryProps {
  conversationId: string | null;
}

export function ConversationHistory({ conversationId }: ConversationHistoryProps) {
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    enabled: !!conversationId,
  });

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <History className="mr-2 h-5 w-5 text-gray-600" />
            Recent Conversations
          </h3>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 bg-gray-50">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <History className="mr-2 h-5 w-5 text-gray-600" />
          Recent Conversations
        </h3>

        {messages.length === 0 ? (
          <div className="text-center py-8">
            <History className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500">No conversations yet</p>
            <p className="text-gray-400 text-sm">Start by recording your first message</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {messages.map((message: Message) => (
              <div key={message.id} className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === 'user' 
                    ? 'bg-blue-100' 
                    : 'bg-green-100'
                }`}>
                  {message.type === 'user' ? (
                    <User className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Bot className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={`rounded-lg p-3 shadow-sm ${
                    message.type === 'user' 
                      ? 'bg-white' 
                      : 'bg-green-50'
                  }`}>
                    <p className="text-gray-800 text-sm">{message.content}</p>
                    <div className="flex items-center mt-2 space-x-2">
                      {message.audioUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`text-xs ${
                            message.type === 'user' 
                              ? 'text-blue-600 hover:text-blue-700' 
                              : 'text-green-600 hover:text-green-700'
                          }`}
                          onClick={() => playAudio(message.audioUrl!)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Play
                        </Button>
                      )}
                      <span className="text-gray-400 text-xs">
                        {formatTime(message.timestamp.toString())}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 25. client/src/components/settings-panel.tsx
```typescript
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X, Settings as SettingsIcon, Info, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Settings } from '@shared/schema';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ['/api/settings'],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<Settings>) => {
      const response = await apiRequest('PATCH', '/api/settings', newSettings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (key: keyof Settings, value: any) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  if (!isOpen) return null;

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <SettingsIcon className="mr-2 h-5 w-5" />
            Settings
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        ) : settings ? (
          <div className="space-y-6">
            {/* AI Provider Selection */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                AI Provider
              </Label>
              <Select
                value={settings.aiProvider || "gemini"}
                onValueChange={(value) => 
                  handleSettingChange('aiProvider', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="groq">Groq</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Groq Model Selection */}
            {settings && settings.aiProvider === "groq" && (
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Groq Model
                </Label>
                <Select
                  value={settings.groqModel || "llama-3.3-70b-versatile"}
                  onValueChange={(value) => 
                    handleSettingChange('groqModel', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B (Recommended)</SelectItem>
                    <SelectItem value="llama-3.1-8b-instant">Llama 3.1 8B (Fast)</SelectItem>
                    <SelectItem value="gemma2-9b-it">Gemma 2 9B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* NSFW Mode */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-gray-700">
                  NSFW Mode
                </Label>
                <p className="text-sm text-gray-500">
                  Enables adult conversations with reduced content filtering
                </p>
              </div>
              <Switch
                checked={settings.nsfwMode || false}
                onCheckedChange={(checked) => 
                  handleSettingChange('nsfwMode', checked)
                }
              />
            </div>

            {/* API Keys Configuration */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">
                API Keys Configuration
              </Label>
              
              {/* Gemini API Key */}
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">
                  Google Gemini API Key
                </Label>
                <div className="relative">
                  <Input
                    type={showGeminiKey ? "text" : "password"}
                    placeholder="Enter your Gemini API key"
                    value={settings.geminiApiKey || ""}
                    onChange={(e) => handleSettingChange('geminiApiKey', e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                  >
                    {showGeminiKey ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Groq API Key */}
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">
                  Groq API Key
                </Label>
                <div className="relative">
                  <Input
                    type={showGroqKey ? "text" : "password"}
                    placeholder="Enter your Groq API key"
                    value={settings.groqApiKey || ""}
                    onChange={(e) => handleSettingChange('groqApiKey', e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowGroqKey(!showGroqKey)}
                  >
                    {showGroqKey ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-blue-700">
                        Get your Gemini API key from <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>
                        <br />
                        Get your Groq API key from <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer" className="underline">Groq Console</a>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Audio Settings */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Audio Quality
              </Label>
              <Select
                value={settings.audioQuality || "standard"}
                onValueChange={(value) => 
                  handleSettingChange('audioQuality', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Quality</SelectItem>
                  <SelectItem value="high">High Quality</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Voice Settings */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                AI Voice
              </Label>
              <Select
                value={settings.voiceType || "neural"}
                onValueChange={(value) => 
                  handleSettingChange('voiceType', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neural">Neural Voice</SelectItem>
                  <SelectItem value="standard">Standard Voice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auto-play Responses */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-gray-700">
                  Auto-play AI Responses
                </Label>
                <p className="text-sm text-gray-500">
                  Automatically play AI responses when received
                </p>
              </div>
              <Switch
                checked={settings.autoPlay || false}
                onCheckedChange={(checked) => 
                  handleSettingChange('autoPlay', checked)
                }
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">Failed to load settings</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 26. client/src/hooks/use-audio-recorder.ts
```typescript
import { useState, useRef, useCallback } from 'react';

export interface AudioRecorderState {
  isRecording: boolean;
  isProcessing: boolean;
  mediaRecorder: MediaRecorder | null;
  audioBlob: Blob | null;
  error: string | null;
}

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isProcessing: false,
    mediaRecorder: null,
    audioBlob: null,
    error: null,
  });

  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null, isProcessing: true }));

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setState(prev => ({
          ...prev,
          audioBlob,
          isRecording: false,
          isProcessing: false,
        }));

        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();

      setState(prev => ({
        ...prev,
        mediaRecorder,
        isRecording: true,
        isProcessing: false,
        audioBlob: null,
      }));

    } catch (error) {
      console.error('Error starting recording:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to start recording. Please check microphone permissions.',
        isProcessing: false,
      }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (state.mediaRecorder && state.isRecording) {
      state.mediaRecorder.stop();
      setState(prev => ({ ...prev, isProcessing: true }));
    }
  }, [state.mediaRecorder, state.isRecording]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    if (state.mediaRecorder && state.isRecording) {
      state.mediaRecorder.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setState({
      isRecording: false,
      isProcessing: false,
      mediaRecorder: null,
      audioBlob: null,
      error: null,
    });
  }, [state.mediaRecorder, state.isRecording]);

  return {
    ...state,
    startRecording,
    stopRecording,
    clearError,
    reset,
  };
}
```

### 27. client/src/hooks/use-toast.ts
```typescript
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
```

### 28. client/src/hooks/use-mobile.tsx
```typescript
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
```

### 29. client/src/lib/queryClient.ts
```typescript
import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const json = await res.json();
      if (json.message) {
        errorMessage = json.message;
      }
    } catch {
      const text = await res.text();
      if (text) {
        errorMessage = text;
      }
    }
    const error = new Error(errorMessage);
    (error as any).response = res;
    (error as any).status = res.status;
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const isFormData = data instanceof FormData;
  
  const res = await fetch(url, {
    method,
    headers: isFormData ? {} : data ? { "Content-Type": "application/json" } : {},
    body: isFormData ? data : data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
```

### 30. client/src/lib/utils.ts
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```
