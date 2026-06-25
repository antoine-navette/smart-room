import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';

type FavoriteRemovalModalProps = {
  open: boolean;
  roomName: string;
  location?: string;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function FavoriteRemovalModal({
  open,
  roomName,
  location,
  isPending = false,
  onClose,
  onConfirm,
}: FavoriteRemovalModalProps) {
  return (
    <Modal
      open={open}
      onClose={() => {
        if (!isPending) {
          onClose();
        }
      }}
      title="Retirer cette salle des favoris ?"
      description="Tu pourras toujours la retrouver depuis la recherche et la remettre en favoris plus tard."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            <Icon name="close" />
            Annuler
          </Button>

          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={isPending}
          >
            <Icon name="delete" />
            {isPending ? 'Suppression...' : 'Retirer des favoris'}
          </Button>
        </>
      }
    >
      <div className="border-[3px] border-on-surface bg-surface-container-lowest p-4">
        <p className="font-label-bold font-bold uppercase text-on-surface-variant">
          Salle concernee
        </p>
        <p className="mt-2 font-headline-md font-bold text-[24px] text-on-surface">
          {roomName}
        </p>
        {location ? (
          <p className="mt-1 font-body-md text-on-surface-variant">{location}</p>
        ) : null}
      </div>
    </Modal>
  );
}