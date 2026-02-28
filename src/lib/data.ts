import { useState } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

export interface SymptomEntry {
  id: string;
  date: Date;
  painScore: number;
  energyScore: number;
  triggers: string[];
  symptoms: string[];
  notes: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: "mental-health" | "article" | "meditation" | "website";
  url?: string;
  emoji: string;
}

export interface UserProfile {
  name: string;
  dob: string;
  buddyName: string;
  buddyAvatar: string;
}

// Mock data
export const mockMessages: ChatMessage[] = [
  {
    id: "1",
    role: "ai",
    content: "Hey bestie! 💛 How are you feeling today? Tell me everything — the good, the bad, the ugh.",
    timestamp: new Date(Date.now() - 3600000 * 2),
  },
  {
    id: "2",
    role: "user",
    content: "Honestly not great. My joints are killing me and I barely slept.",
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: "3",
    role: "ai",
    content: "Ugh I'm so sorry 😔 That sounds really rough. On a scale of 1-10, where would you put the joint pain? And was the sleep thing because of the pain or something else?",
    timestamp: new Date(Date.now() - 3500000),
  },
  {
    id: "4",
    role: "user",
    content: "Pain is probably a 7. And yeah the pain kept waking me up. Also I think the weather change is making it worse.",
    timestamp: new Date(Date.now() - 3000000),
  },
  {
    id: "5",
    role: "ai",
    content: "Got it, logging that for you! 📝 Joint pain at 7/10, poor sleep due to pain, and weather as a trigger. You're doing amazing just by tracking this stuff. Want to talk more or take it easy?",
    timestamp: new Date(Date.now() - 2900000),
  },
];

export const mockEntries: SymptomEntry[] = [
  {
    id: "1",
    date: new Date(),
    painScore: 7,
    energyScore: 3,
    triggers: ["Weather change", "Poor sleep"],
    symptoms: ["Joint pain", "Fatigue", "Brain fog"],
    notes: "Joints really bad today. Weather changing. Barely slept.",
  },
  {
    id: "2",
    date: new Date(Date.now() - 86400000),
    painScore: 5,
    energyScore: 5,
    triggers: ["Stress"],
    symptoms: ["Headache", "Muscle tension"],
    notes: "Moderate day. Work stress made things flare a bit.",
  },
  {
    id: "3",
    date: new Date(Date.now() - 86400000 * 2),
    painScore: 3,
    energyScore: 7,
    triggers: [],
    symptoms: ["Mild stiffness"],
    notes: "Pretty good day! Morning stiffness but it faded.",
  },
  {
    id: "4",
    date: new Date(Date.now() - 86400000 * 3),
    painScore: 6,
    energyScore: 4,
    triggers: ["Diet", "Lack of movement"],
    symptoms: ["Joint pain", "Nausea"],
    notes: "Ate something that didn't agree with me.",
  },
  {
    id: "5",
    date: new Date(Date.now() - 86400000 * 4),
    painScore: 4,
    energyScore: 6,
    triggers: ["Weather change"],
    symptoms: ["Joint pain", "Fatigue"],
    notes: "Okay day overall. Rain coming in.",
  },
  {
    id: "6",
    date: new Date(Date.now() - 86400000 * 5),
    painScore: 2,
    energyScore: 8,
    triggers: [],
    symptoms: [],
    notes: "Great day! Went for a walk.",
  },
  {
    id: "7",
    date: new Date(Date.now() - 86400000 * 6),
    painScore: 5,
    energyScore: 5,
    triggers: ["Stress"],
    symptoms: ["Headache"],
    notes: "Average. Work was stressful.",
  },
];

export const mockResources: Resource[] = [
  {
    id: "1",
    title: "Coping with Chronic Pain",
    description: "Evidence-based strategies for managing daily pain without letting it run your life.",
    category: "article",
    emoji: "📖",
  },
  {
    id: "2",
    title: "5-Minute Body Scan",
    description: "A gentle guided meditation to check in with your body and release tension.",
    category: "meditation",
    emoji: "🧘",
  },
  {
    id: "3",
    title: "Spoon Theory Explained",
    description: "Understanding energy management when you're living with chronic illness.",
    category: "article",
    emoji: "🥄",
  },
  {
    id: "4",
    title: "Crisis Text Line",
    description: "Text HOME to 741741 to connect with a trained crisis counselor anytime.",
    category: "mental-health",
    emoji: "💚",
  },
  {
    id: "5",
    title: "Sleep Hygiene for Pain",
    description: "Tips for better sleep when chronic pain keeps you up at night.",
    category: "website",
    emoji: "🌙",
  },
  {
    id: "6",
    title: "Gratitude Journaling",
    description: "A 3-minute practice to shift focus even on hard days.",
    category: "meditation",
    emoji: "✨",
  },
];

export const BUDDY_AVATARS = [
  { id: "bear", emoji: "🐻", name: "Bear" },
  { id: "cat", emoji: "🐱", name: "Cat" },
  { id: "dog", emoji: "🐶", name: "Dog" },
  { id: "owl", emoji: "🦉", name: "Owl" },
  { id: "fox", emoji: "🦊", name: "Fox" },
  { id: "rabbit", emoji: "🐰", name: "Rabbit" },
];

export const getBuddyEmoji = (id: string) =>
  BUDDY_AVATARS.find((a) => a.id === id)?.emoji || "🐻";

export const SUGGESTED_SYMPTOMS = [
  "Fatigue",
  "Brain fog",
  "Joint pain",
  "Muscle aches",
  "Headache",
  "Nausea",
  "Dizziness",
  "Insomnia",
  "Stiffness",
  "Numbness / tingling",
  "Back pain",
  "Cramping",
  "Bloating",
  "Anxiety",
  "Shortness of breath",
  "Sensitivity to light",
  "Sensitivity to sound",
  "Swelling",
  "Chest tightness",
  "Hot flashes",
];

/** @deprecated Use BUDDY_AVATARS instead */
export const buddyAvatars = BUDDY_AVATARS.map((a) => a.emoji);
