import type { Transporter } from 'nodemailer';
import type { Incident } from '../entities/incident.entity.js';
import type { Reservation } from '../entities/reservation.entity.js';
import type { Room } from '../entities/room.entity.js';
import type { User } from '../entities/user.entity.js';

const ADMIN_EMAIL = 'admin@smart-room.fr';
const FROM = 'noreply@smart-room.fr';

const formatDate = (date: Date) => date.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

export class Mailer {
    constructor(private readonly transporter: Transporter) {}

    async sendReservationConfirmation(user: User, reservation: Reservation, room: Room | null) {
        await this.transporter.sendMail({
            from: FROM,
            to: user.email,
            subject: 'Confirmation de votre réservation',
            text: `Bonjour ${user.first_name},\n\nVotre réservation a bien été enregistrée.\n\nSalle : ${room?.name ?? 'non assignée'}\nDébut : ${formatDate(reservation.start_time)}\nFin : ${formatDate(reservation.end_time)}\n\nL'équipe Smart Room`,
        });
    }

    async sendReservationUpdate(user: User, reservation: Reservation, room: Room | null) {
        await this.transporter.sendMail({
            from: FROM,
            to: user.email,
            subject: 'Modification de votre réservation',
            text: `Bonjour ${user.first_name},\n\nVotre réservation a bien été modifiée.\n\nSalle : ${room?.name ?? 'non assignée'}\nDébut : ${formatDate(reservation.start_time)}\nFin : ${formatDate(reservation.end_time)}\n\nL'équipe Smart Room`,
        });
    }

    async sendReservationCancellation(user: User, reservation: Reservation, room: Room | null) {
        await this.transporter.sendMail({
            from: FROM,
            to: user.email,
            subject: 'Annulation de votre réservation',
            text: `Bonjour ${user.first_name},\n\nVotre réservation a été annulée.\n\nSalle : ${room?.name ?? 'non assignée'}\nDébut : ${formatDate(reservation.start_time)}\nFin : ${formatDate(reservation.end_time)}\n\nL'équipe Smart Room`,
        });
    }

    async sendIncidentReport(reporter: User, incident: Incident, room: Room | null) {
        await this.transporter.sendMail({
            from: FROM,
            to: ADMIN_EMAIL,
            subject: `Nouveau signalement : ${incident.title}`,
            text: `Un nouveau problème a été signalé.\n\nSignalé par : ${reporter.first_name} ${reporter.last_name} (${reporter.email})\nSalle : ${room?.name ?? 'non précisée'}\nTitre : ${incident.title}${incident.description ? `\nDescription : ${incident.description}` : ''}\n\nL'équipe Smart Room`,
        });
    }

    async sendRoomUnavailabilityNotification(user: User, reservation: Reservation, room: Room, reason: string) {
        await this.transporter.sendMail({
            from: FROM,
            to: user.email,
            subject: 'Votre réservation a été annulée',
            text: `Bonjour ${user.first_name},\n\nVotre réservation dans la salle ${room.name} a été annulée suite à une indisponibilité.\n\nDébut : ${formatDate(reservation.start_time)}\nFin : ${formatDate(reservation.end_time)}\nMotif : ${reason}\n\nL'équipe Smart Room`,
        });
    }
}