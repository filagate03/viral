import { defineScore } from '../score';
export async function searchYouTube({ topic, limit=50 }){
  const key=process.env.YT_API_KEY; if(!key) return {items:[],creators:[]};
  const q=encodeURIComponent(topic);
  const s=await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${Math.min(50,limit)}&q=${q}&key=${key}`).then(r=>r.json());
  const ids=(s.items||[]).map(i=>i.id.videoId).filter(Boolean).join(','); if(!ids) return {items:[],creators:[]};
  const v=await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${ids}&key=${key}`).then(r=>r.json());
  const now=Date.now();
  const items=(v.items||[]).map(x=>{const views=Number(x.statistics?.viewCount||0);const age=Math.max(1,Math.round((now-new Date(x.snippet?.publishedAt).getTime())/86400000));const row={id:x.id,platform:'youtube',title:x.snippet?.title||'',url:`https://www.youtube.com/watch?v=${x.id}`,channel_title:x.snippet?.channelTitle||'',channel_url:`https://www.youtube.com/channel/${x.snippet?.channelId}`,published_at:x.snippet?.publishedAt,age_days:age,view_count:views,like_count:Number(x.statistics?.likeCount||0),comment_count:Number(x.statistics?.commentCount||0),share_count:0,views_per_day:Math.round(views/age)};return {...row,...defineScore(row)};});
  return {items:items.slice(0,limit),creators:[]};
}
