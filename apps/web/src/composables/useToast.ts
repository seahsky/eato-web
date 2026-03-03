import { toastController, alertController } from '@ionic/vue'

export function useToast() {
  async function showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success', duration = 2000) {
    const toast = await toastController.create({
      message,
      duration,
      color,
      position: 'bottom',
    })
    await toast.present()
  }

  async function showError(message: string) {
    await showToast(message, 'danger', 3000)
  }

  async function showSuccess(message: string) {
    await showToast(message, 'success')
  }

  async function confirm(header: string, message: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await alertController.create({
        header,
        message,
        buttons: [
          { text: 'Cancel', role: 'cancel', handler: () => resolve(false) },
          { text: 'Confirm', role: 'confirm', handler: () => resolve(true) },
        ],
      })
      await alert.present()
    })
  }

  return { showToast, showError, showSuccess, confirm }
}
