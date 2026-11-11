import fs from 'node:fs';
import {buildTripTicketPdf} from '../client/src/lib/tripTicketPdf.js';
const logo='data:image/png;base64,'+fs.readFileSync('public/ched-logo.png').toString('base64');
const ticket={ticketNo:'CHED-TT-2026-00001',travelDate:'2026-11-09',driverName:'Richard Manuel',vehiclePlate:'SNN 2067',passengerName:'Maria Santos\nJuan Dela Cruz',destination:'Makati City',purpose:'Official meeting',approvedBy:'Authorizing Official',report:{departureTime:'08:00',arrivalTime:'09:30',destinationDepartureTime:'15:00',returnTime:'16:30',distanceTravelled:80,fuelBalance:20,fuelIssued:10,fuelUsed:8,fuelEndingBalance:22,speedometerStart:10000,speedometerEnd:10080}};
fs.writeFileSync('tmp/pdfs/sample.pdf',Buffer.from(buildTripTicketPdf(ticket,logo).output('arraybuffer')));
fs.writeFileSync('tmp/pdfs/blank.pdf',Buffer.from(buildTripTicketPdf({},logo).output('arraybuffer')));
const long={...ticket,passengerName:Array.from({length:18},(_,i)=>`Passenger ${i+1} Full Name`).join('\n'),purpose:'Official travel and coordination with the regional office. '.repeat(10)};
fs.writeFileSync('tmp/pdfs/long.pdf',Buffer.from(buildTripTicketPdf(long,logo).output('arraybuffer')));
