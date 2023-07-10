import { copyFileSync, existsSync, renameSync } from 'fs'
import { basename, dirname, resolve } from 'path'

export function copyDatabase(sourcePath: string, destName: string) {
  const sourceName = basename(sourcePath)
  copyFileSync(sourcePath, resolve(dirname(sourcePath), destName))
  // also need to copy shm and wal, in case journal_mode = WAL
  const shm = resolve(dirname(sourcePath), `${sourceName}-shm`)
  if (existsSync(shm)) {
    copyFileSync(shm, resolve(dirname(sourcePath), `${destName}-shm`))
  }
  const wal = resolve(dirname(sourcePath), `${sourceName}-wal`)
  if (existsSync(wal)) {
    copyFileSync(wal, resolve(dirname(sourcePath), `${destName}-wal`))
  }
}

export function renameDatabase(sourcePath: string, destName: string) {
  const sourceName = basename(sourcePath)
  renameSync(sourcePath, resolve(dirname(sourcePath), destName))
  // also need to rename shm and wal, in case journal_mode = WAL
  const shm = resolve(dirname(sourcePath), `${sourceName}-shm`)
  if (existsSync(shm)) {
    renameSync(shm, resolve(dirname(sourcePath), `${destName}-shm`))
  }
  const wal = resolve(dirname(sourcePath), `${sourceName}-wal`)
  if (existsSync(wal)) {
    renameSync(wal, resolve(dirname(sourcePath), `${destName}-wal`))
  }
}
