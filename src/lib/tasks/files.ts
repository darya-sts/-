const DB_NAME = "forgemill-task-files"
const STORE = "blobs"
const VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function putAttachmentBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.objectStore(STORE).put(blob, id)
  })
  db.close()
}

export async function getAttachmentBlob(id: string): Promise<Blob | undefined> {
  const db = await openDb()
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly")
    const request = tx.objectStore(STORE).get(id)
    request.onsuccess = () => resolve(request.result as Blob | undefined)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return blob
}

export async function deleteAttachmentBlob(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.objectStore(STORE).delete(id)
  })
  db.close()
}

export function isImageFile(file: { type: string; name: string }) {
  if (file.type.startsWith("image/")) return true
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name)
}

export function isTextFile(file: { type: string; name: string }) {
  if (file.type.startsWith("text/") || file.type === "application/json") return true
  return /\.(md|txt|json|csv|ts|tsx|js|css|html)$/i.test(file.name)
}
