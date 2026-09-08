// course.js — single import point for the canonical course data (data/course.json).
// Everything that renders schedule / assessment / lectures reads from here, so the
// future G1 shared-data gate has one source to check against.
import course from '../../data/course.json';
export { course };
export default course;
