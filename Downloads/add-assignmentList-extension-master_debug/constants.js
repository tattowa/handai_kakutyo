export const url = 'https://www.cle.osaka-u.ac.jp/learn/api/v1/calendars/dueDateCalendarItems';
export const assignmentIdBaseLink = 'https://www.cle.osaka-u.ac.jp/learn/api/public/v2/courses/';
export const contentlinkBase = 'https://www.cle.osaka-u.ac.jp/ultra/courses/';
export const classListApiUrl = 'https://www.cle.osaka-u.ac.jp//learn/api/public/v1/calendars/';


export const dateCompareText = {
  GREATER_OR_EQUAL: 'greaterOrEqual',
  LESS_OR_EQUAL: 'lessOrEqual',
};

export const calendarDataLimit = 20;

export const assignmentDeadline = {
  TODAY: 0,
  TOMORROW: 1,
  FUTURE: 2,
  EXPIRED: 3,
};

export const jsInitCheckMilliSecond = 2000;

const origin_date = new Date();
export const yearOfClassId = origin_date.getFullYear();

// Aなら前期、Bなら後期
export const semester = {
  EARLY: 'A',
  LATE: 'B',
};

export function formatDateForShow(dt) {
  const y = dt.getFullYear();
  const m = ('00' + (dt.getMonth() + 1)).slice(-2);
  const d = ('00' + dt.getDate()).slice(-2);
  const h = dt.getHours().toString().padStart(2, '0');
  const M = dt.getMinutes().toString().padStart(2, '0');
  return y + '-' + m + '-' + d + ' ' + h + ':' + M;
}

export function getClassUrl(id) {
  return contentlinkBase + id + '/outline';
}

export function getAssignmentUrl(courseId, columnId) {
  return contentlinkBase + courseId + '/outline/assessment/' + columnId + '/overview?courseId=' + courseId;
}

export function getProgresstUrl(courseId, columnId, progressId) {
  return contentlinkBase + courseId + '/outline/assessment/' + columnId + '/overview/attempt/' + progressId + '?courseId=' + courseId;
}

export function getReviewtUrl(courseId, columnId, itemSourceId,  progressId) {
  return contentlinkBase + courseId + '/outline/assessment/' + columnId + '/overview/attempt/' + progressId + '/review/inline-feedback?'
  + 'attemptId=' + progressId + '&mode=inline&columnId=' + itemSourceId + '&contentId='+ columnId + '&courseId=' + courseId
}
export function getColumnRequestUrl(courseId, itemSourceId){
  return assignmentIdBaseLink + courseId + '/gradebook/columns/' + itemSourceId
}

export function getAssignmentStatusUrl(courseId, itemSourceId){
  return assignmentIdBaseLink + courseId + '/gradebook/columns/' + itemSourceId + '/attempts?'
}