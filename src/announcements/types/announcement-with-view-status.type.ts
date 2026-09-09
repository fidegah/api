import { Announcement } from '../../db/schema';

export type AnnouncementWithViewStatus = Announcement & { isViewed: boolean };
