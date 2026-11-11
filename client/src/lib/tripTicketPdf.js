import { formatPassengerNames } from './passengerNames.js';
import { jsPDF } from 'jspdf';
import { showDialog } from './dialog';

const present = x => x !== undefined && x !== null && x !== '';
const displayDate = x => x ? new Date(x).toLocaleDateString('en-PH', {month:'long',day:'numeric',year:'numeric'}) : '';
const displayTime = x => {
  if (!x) return '';
  const [h,m] = x.split(':');
  return `${Number(h)%12 || 12}:${m} ${Number(h)<12?'AM':'PM'}`;
};

// Coordinates are in points, matching the supplied A4 CHED form.
export function buildTripTicketPdf(t, logo) {
  const d = new jsPDF({unit:'pt',format:'a4'});
  const right = 488, bottom = 815;
  let y = 210.6;
  d.setTextColor(0); d.setDrawColor(0); d.setLineWidth(.55);
  const text = (s,x,y,size=10.5,bold=true,options={}) => {
    d.setFont('times',bold?'bold':'normal'); d.setFontSize(size);
    d.text(String(s ?? ''),x,y,options);
  };
  const rule = (x,y,end=right) => d.line(x,y,end,y);
  const room = height => {
    if (y+height > bottom) { d.addPage(); y=45; text('TRIP TICKET (continued)',52,y); y+=24; }
  };
  const entry = (label,value,x=282,end=right,unit='',labelX=89.3,center=false) => {
    d.setFont('times','normal'); d.setFontSize(10);
    const lines = present(value) ? d.splitTextToSize(String(value),end-x-8) : [''];
    const height = Math.max(13.62,lines.length*12);
    room(Math.min(height,14));
    if(label) text(label,labelX,y);
    let offset=0;
    lines.forEach((line,i)=>{
      if(i && y+offset+14>bottom) { y+=offset; room(14); offset=0; }
      text(line,center?(x+end)/2:x+4,y+offset,10,false,center?{align:'center'}:{}); rule(x,y+offset+3,end); offset+=12;
    });
    if(unit) text(unit,end+3,y);
    y+=Math.max(13.62,offset);
  };
  if(logo) d.addImage(logo,'PNG',70,43,58,58);
  text('Republic of the Philippines',286.5,59.8,9.5,true,{align:'center'});
  text('Office of the President',286.5,72.7,9.5,true,{align:'center'});
  text('COMMISSION ON HIGHER EDUCATION',286.5,89.6,12,true,{align:'center'});
  text('HEDC Bldg., C.P. Garcia Ave., Diliman, Quezon City',286.5,104.5,9,true,{align:'center'});
  text('No.',356.1,128.9); rule(374,132);
  rule(374,145.6); text(displayDate(t.travelDate),431,142.5,9,false,{align:'center'});
  text('Date',434,156.1,10.5,true,{align:'center'});
  text('TRIP TICKET',263,170.5,11.5,true,{align:'center'});
  text('A. To be filled by the Administrative Official authorizing Official Travel:',52.3,197);
  const numbered = (n,label,value,x=254.2) => {
    room(14); text(`${n}.`,69.9,y); entry(label,value,x,right,'',89.3,n<=4);
  };
  numbered(1,'Name of the Driver of the Vehicle',t.driverName);
  numbered(2,'Government car to use, Plate No.',[t.vehicleName,t.vehiclePlate].filter(Boolean).join(' · '));
  numbered(3,'Name of authorized passenger',formatPassengerNames(t.passengerName));
  numbered(4,'Place or places to be visited/inspected',t.destination,282);
  y+=10.4;
  numbered(5,'Purpose',t.purpose,136);
  y+=11.7; room(60); text('Approved by:',256.7,y);
  y+=32.2; rule(254.2,y); text(t.approvedBy || '',371,y-4,10,false,{align:'center'});
  text('Commissioner',371,y+12,10,false,{align:'center'});
  y+=27;
  room(28); text('B. To be filled by the Driver:',52.3,y); y+=13.62;
  const r=t.report || {};
  const reportRow=(n,label,value,x=282,unit='',end=458)=>{
    room(14); if(n) text(`${n}.`,69.9,y); entry(label,value,x,end,unit,89.3,n>=1&&n<=4);
  };
  reportRow(1,'Time of Departure from Office/Garage',displayTime(r.departureTime),282,'',432);
  reportRow(2,'Time of arrival at (per No. 4 above)',displayTime(r.arrivalTime),282,'',432);
  reportRow(3,'Time of Departure from (per No. 4)',displayTime(r.destinationDepartureTime),282,'',432);
  reportRow(4,'Time of Arrival back to Office/Garage',displayTime(r.returnTime),282,'',432);
  reportRow(5,'Approximate distance travelled (to and from)',r.distanceTravelled,351,'km',432);
  room(14);text('6.',69.9,y);text('Gasoline issued, purchase and consumed:',89.3,y);y+=13.62;
  const sub=(label,value,x=303,unit='liters',center=false)=>entry(label,value,x,458,unit,138.6,center);
  sub('a) Balance in tank',r.fuelBalance,233);
  sub('b) Issued by the office from stock',r.fuelIssued);
  sub('c) Add-purchased during trip',r.fuelPurchased,281);
  const fuel=[r.fuelBalance,r.fuelIssued,r.fuelPurchased];
  entry('TOTAL:',fuel.some(present)?fuel.reduce((sum,v)=>sum+Number(v||0),0):'',238,458,'liters',193.8);
  sub('d) Deduct: Used During the trip (to and from)',r.fuelUsed,374);
  sub('e) Balance in tank at the end trip',r.fuelEndingBalance);
  reportRow(7,'Gear Oil used',r.gearOil,191,'liters');
  reportRow(8,'Lubricating oil used',r.lubricatingOil,191,'liters');
  reportRow(9,'Grease issued',r.grease,191,'liters');
  room(14);text('10.',69.9,y);text('Speedometer reading, if any:',89.3,y);y+=13.62;
  sub('a) At beginning of Trip',r.speedometerStart,254,'kms.',true);
  sub('b) At end of trip',r.speedometerEnd,233,'kms.',true);
  const distance=present(r.speedometerStart)&&present(r.speedometerEnd)?Math.max(0,Number(r.speedometerEnd)-Number(r.speedometerStart)):r.speedometerDistance;
  sub('c) Distance travelled (per No. 5 above)',distance,334,'kms.',true);
  reportRow(11,'Remarks:',r.remarks,136);
  y+=13.6; room(139);
  text('I hereby certify to the correctness of the statement of record of travel',89.3,y);
  y+=34;rule(303.5,y);y+=11;text('Signature of Driver',(303.5+right)/2,y,10.5,true,{align:'center'});
  y+=19.5;text('I hereby certify that I used this car on official business of record of travel.',89.3,y);
  y+=34;rule(303.5,y);y+=11;text('Signature of Passenger',(303.5+right)/2,y,10.5,true,{align:'center'});
  y+=19.5;text('Date:',306,y);text(displayDate(r.passengerSignedDate),338,y,10,false);rule(303.5,y+9);
  return d;
}

let logoPromise;
export async function createTripTicketPdf(ticket) {
    logoPromise ||= fetch(`${import.meta.env.BASE_URL}ched-logo.png`).then(async response => {
      if(!response.ok) throw new Error('CHED logo could not be loaded.');
      const blob=await response.blob();
      return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
    }).catch(error=>{logoPromise=null;throw error;});
    const logo=await logoPromise;
    return buildTripTicketPdf(ticket,logo);
}

export async function makePdf(ticket) {
  try {
    const pdf = await createTripTicketPdf(ticket);
    pdf.save(`${ticket.ticketNo || 'trip-ticket'}.pdf`);
  } catch(error) {
    await showDialog({ title: 'Unable to export PDF', message: error.message || 'Unable to export PDF. Please try again.' });
  }
}
