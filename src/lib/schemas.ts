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
    slug: z.string().nullable().optional().default(""),
    name: z.string(),
    description: z.string().nullable().optional(),
    start_date: z.string().nullable().optional().default(new Date().toISOString()),
    location: z.string().nullable().optional(),
    banner_url: z.string().nullable().optional(),
    status: z.string().default("scheduled"),
    event_type: z.string().nullable().optional(),
    regulation: z.string().nullable().optional(),
    lots: z.array(z.any()).optional(),
    end_date: z.string().nullable().optional(),
    active_lot_id: z.string().uuid().nullable().optional(),
    active_lot: z.any().nullable().optional(),
    viewers: z.preprocess((val) => (val === null || val === undefined) ? 0 : val, z.number().int().nonnegative().default(0)),
    auctioneer_name: z.string().nullable().optional(),
    promoter_company: z.string().nullable().optional(),
    transmission_link: z.string().nullable().optional(),
    live_status_message: z.string().nullable().optional(),
    show_countdown: z.preprocess((val) => (val === null || val === undefined) ? true : val, z.boolean().default(true)),
    photos: z.array(z.string()).nullable().optional().default([]),
    seller_id: z.string().uuid().nullable().optional(),
    seller_name: z.string().nullable().optional(),
    allows_pre_bidding: z.boolean().nullable().optional().default(true),
  }).passthrough();
 
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
    vaccination_records: z.array(z.any()).nullable().optional(),
    youtube_url: z.string().nullable().optional(),
    pedigree_url: z.string().nullable().optional(),
    registration_1cc: z.string().nullable().optional(),
    registration_2: z.string().nullable().optional(),
    chip_number: z.string().nullable().optional(),
    book: z.string().nullable().optional(),
    blood_typing: z.string().nullable().optional(),
    blood_percentage: z.string().nullable().optional(),
 });
 
  export const lotSchema = z.object({
    id: z.string().uuid().optional(),
    event_id: z.string().uuid().optional(),
    lot_number: z.number().int().nullable().optional().default(0),
    animal_id: z.string().uuid().optional(),
    starting_price: z.number().nonnegative().nullable().optional(),
    current_price: z.number().nonnegative().nullable().optional(),
    bid_increment: z.number().nonnegative().nullable().optional().default(0),
    status: z.string().default("upcoming"),
    bids_count: z.preprocess((val) => (val === null || val === undefined) ? 0 : val, z.number().int().nonnegative().default(0)),
    viewers: z.preprocess((val) => (val === null || val === undefined) ? 0 : val, z.number().int().nonnegative().default(0)),
    end_date: z.string().nullable().optional(),
    is_featured: z.boolean().nullable().optional().default(false),
    is_paused: z.boolean().nullable().optional().default(false),
    animal: animalSchema.nullable().optional(),
    event: eventSchema.nullable().optional(),
  }).passthrough();
 
 export type ValidatedEvent = z.infer<typeof eventSchema>;
 export type ValidatedLot = z.infer<typeof lotSchema>;