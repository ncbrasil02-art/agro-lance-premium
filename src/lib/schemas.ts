 import { z } from "zod";
 
 export const siteSettingsSchema = z.object({
   key: z.string(),
   value: z.any(),
 });
 
 export const announcementSchema = z.object({
   active: z.boolean().default(false),
   text: z.string().default(""),
   link: z.string().nullable().optional(),
 });
 
 export const eventSchema = z.object({
   id: z.string().uuid(),
   slug: z.string(),
   name: z.string(),
   description: z.string().nullable().optional(),
   start_date: z.string(),
   location: z.string().nullable().optional(),
   banner_url: z.string().nullable().optional(),
   status: z.enum(["scheduled", "live", "finished"]).default("scheduled"),
   lots: z.array(z.object({ id: z.string().uuid() })).optional(),
   viewers: z.number().int().nonnegative().default(0),
   auctioneer_name: z.string().nullable().optional(),
   promoter_company: z.string().nullable().optional(),
   show_countdown: z.boolean().default(true),
 });
 
 export const animalSchema = z.object({
   id: z.string().uuid(),
   name: z.string(),
   breed: z.string().nullable().optional(),
   species: z.string().nullable().optional(),
   photos: z.array(z.string()).nullable().optional(),
   description: z.string().nullable().optional(),
   birth_date: z.string().nullable().optional(),
   registration_number: z.string().nullable().optional(),
   color: z.string().nullable().optional(),
   weight: z.number().nullable().optional(),
   height: z.number().nullable().optional(),
   sex: z.string().nullable().optional(),
   location: z.string().nullable().optional(),
   genealogy: z.any().nullable().optional(),
   youtube_url: z.string().nullable().optional(),
   pedigree_url: z.string().nullable().optional(),
 });
 
 export const lotSchema = z.object({
   id: z.string().uuid(),
   event_id: z.string().uuid(),
   lot_number: z.number().int().positive(),
   animal_id: z.string().uuid(),
   starting_price: z.number().nonnegative().optional(),
   current_price: z.number().nonnegative().nullable().optional(),
   bid_increment: z.number().nonnegative().default(0),
   status: z.enum(["upcoming", "active", "sold", "passed"]).default("upcoming"),
   bids_count: z.number().int().nonnegative().default(0),
   viewers: z.number().int().nonnegative().default(0),
   end_date: z.string().nullable().optional(),
   animal: animalSchema.nullable().optional(),
   event: eventSchema.nullable().optional(),
 });
 
 export type ValidatedEvent = z.infer<typeof eventSchema>;
 export type ValidatedLot = z.infer<typeof lotSchema>;