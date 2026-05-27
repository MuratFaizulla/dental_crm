import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import App, { getOdontogramState, loadOdontogramState } from './App'
import type { Language } from './i18n/translations'
import type { NumberingSystem } from './utils/numbering'
import { getOdontogram, saveOdontogram } from '../../api/medical'
import './odontogram.css'
import styles from './OdontogramEditor.module.css'

interface Props {
  clientId: number
  readOnly?: boolean
}

export default function OdontogramEditor({ clientId, readOnly = false }: Props) {
  const qc = useQueryClient()
  const appReadyRef = useRef(false)
  const initialLoaded = useRef(false)
  const savedData = useRef<unknown>(null)
  const [lang, setLang] = useState<Language>('ru')
  const [numbering, setNumbering] = useState<NumberingSystem>('FDI')
  const [darkMode, setDarkMode] = useState(false)

  const { data, isSuccess } = useQuery({
    queryKey: ['odontogram', clientId],
    queryFn: () => getOdontogram(clientId),
  })

  const tryLoad = useCallback(() => {
    if (initialLoaded.current) return
    if (!appReadyRef.current) return
    if (!savedData.current) return
    initialLoaded.current = true
    loadOdontogramState(savedData.current)
  }, [])

  useEffect(() => {
    if (isSuccess && data?.odontogram_json) {
      savedData.current = data.odontogram_json
      tryLoad()
    }
  }, [isSuccess, data, tryLoad])

  const handleReady = useCallback(() => {
    appReadyRef.current = true
    tryLoad()
  }, [tryLoad])

  const saveMut = useMutation({
    mutationFn: () => saveOdontogram(clientId, getOdontogramState()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['odontogram', clientId] }),
  })

  return (
    <div className={styles.wrapper}>
      <App
        language={lang}
        onLanguageChange={setLang}
        numberingSystem={numbering}
        onNumberingChange={setNumbering}
        darkMode={darkMode}
        onDarkModeChange={setDarkMode}
        readOnly={readOnly}
        enableNotes={true}
        onReady={handleReady}
      />
      {!readOnly && (
        <div className={styles.saveBar}>
          <button
            className={styles.saveBtn}
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
          >
            {saveMut.isPending ? 'Сохранение...' : 'Сохранить одонтограмму'}
          </button>
          {saveMut.isSuccess && <span className={styles.savedMsg}>Сохранено</span>}
        </div>
      )}
    </div>
  )
}
