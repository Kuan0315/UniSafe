import { Api } from './api';

export async function fetchReports() {
  return Api.get('/reports');
}

export async function createReport(report: {
  type: string;
  title: string;
  description: string;
  location: string;
  time: string;
  anonymous: boolean;
  media: Array<{ uri: string; type: 'image'|'video' }>;
}) {
  return Api.post('/reports', report);
}

export async function upvoteReport(reportId: string) {
  return Api.post(`/reports/${reportId}/upvote`);
}

export async function addComment(reportId: string, body: { text: string; anonymous?: boolean }) {
  return Api.post(`/reports/${reportId}/comments`, body);
}

export async function addReply(reportId: string, commentId: string, body: { text: string; anonymous?: boolean }) {
  return Api.post(`/reports/${reportId}/comments/${commentId}/replies`, body);
}

