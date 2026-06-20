import { Loader2, RotateCcw, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import './CarerContract.css';

const CarerContract = () => {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const drawing=useRef(false);
  const [contract,setContract]=useState<any>(null),[accepted,setAccepted]=useState(false),[signed,setSigned]=useState(false),[loading,setLoading]=useState(true),[submitting,setSubmitting]=useState(false);
  useEffect(()=>{api.get('/contracts/me').then(({data})=>setContract(data)).finally(()=>setLoading(false));},[]);
  const point=(event:React.PointerEvent<HTMLCanvasElement>)=>{const canvas=canvasRef.current!,rect=canvas.getBoundingClientRect();return{x:(event.clientX-rect.left)/rect.width*canvas.width,y:(event.clientY-rect.top)/rect.height*canvas.height}};
  const start=(event:React.PointerEvent<HTMLCanvasElement>)=>{const context=canvasRef.current?.getContext('2d');if(!context)return;const p=point(event);drawing.current=true;context.beginPath();context.moveTo(p.x,p.y);context.lineWidth=3;context.strokeStyle='#193d22'};
  const draw=(event:React.PointerEvent<HTMLCanvasElement>)=>{if(!drawing.current)return;const context=canvasRef.current?.getContext('2d');if(!context)return;const p=point(event);context.lineTo(p.x,p.y);context.stroke();setSigned(true)};
  const clear=()=>{const canvas=canvasRef.current,context=canvas?.getContext('2d');if(canvas&&context)context.clearRect(0,0,canvas.width,canvas.height);setSigned(false)};
  const submit=async()=>{if(!accepted||!signed)return;setSubmitting(true);try{const{data}=await api.post('/contracts/me/sign',{acceptedTerms:true,signatureImage:canvasRef.current?.toDataURL()});setContract(data);}finally{setSubmitting(false)}};
  if(loading)return <div className="contract-page"><Navbar/><main className="stitch-state"><Loader2 className="spinner"/>Đang tải hợp đồng...</main></div>;
  return <div className="contract-page"><Navbar/><main className="container contract-shell"><div className="contract-layout">
    <section className="contract-document-card"><header><div><h1>{contract?.templateTitle || 'Hợp đồng hợp tác chuyên gia'}</h1><p>Mã hợp đồng: #{String(contract?._id || '').slice(-10).toUpperCase()}</p></div><span>{contract?.status === 'signed' ? 'ĐÃ KÝ' : 'CHƯA KÝ'}</span></header><article><h2>{contract?.templateTitle}</h2><p className="effective">Phiên bản: {contract?.templateVersion}</p><div style={{whiteSpace:'pre-wrap',lineHeight:1.8}}>{contract?.contractText}</div></article></section>
    <aside className="contract-sign-panel"><h2>{contract?.status === 'signed' ? 'Hợp đồng đã hoàn tất' : 'Hoàn tất thỏa thuận'}</h2>{contract?.status === 'signed' ? <><ShieldCheck/><p>Đã ký lúc {new Date(contract.signedAt).toLocaleString('vi-VN')}</p>{contract.signatureImage&&<img src={contract.signatureImage} alt="Chữ ký" style={{width:'100%'}}/>}</> : <><label className="agreement-check"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>Tôi đã đọc và đồng ý với tất cả các điều khoản và điều kiện được nêu trong Thỏa thuận hợp tác.</span></label><h3>Chữ ký điện tử</h3><div className="signature-box"><button onClick={clear}><RotateCcw/></button><canvas ref={canvasRef} width={600} height={220} onPointerDown={start} onPointerMove={draw} onPointerUp={()=>drawing.current=false}/><span>Ký bằng chuột hoặc chạm</span></div><button className="sign-submit" disabled={!accepted||!signed||submitting} onClick={submit}>{submitting?'Đang gửi...':'Ký & Gửi thỏa thuận'}</button></>}<footer><ShieldCheck/><p>Chữ ký điện tử được lưu cùng thời gian, địa chỉ IP và thiết bị ký.</p></footer></aside>
  </div></main><Footer/></div>;
};
export default CarerContract;
