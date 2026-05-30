export class TimeLog {
  constructor({ id, projectName, description, startTime, endTime, duration }) {
    this.id = id || crypto.randomUUID();
    this.projectName = projectName;
    this.description = description || '';
    this.startTime = startTime; // ISO String
    this.endTime = endTime;     // ISO String
    this.duration = duration;   // in seconds
  }
}
