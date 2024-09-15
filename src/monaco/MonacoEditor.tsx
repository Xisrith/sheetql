import { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';

interface Props {
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
}

export const MonacoEditor = ({ onChange, onSubmit }: Props) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>();

  // Setup monaco editor
  useEffect(() => {
    if (divRef.current) {
      setEditor(e => {
        if (e) {
          return e;
        }
        return monaco.editor.create(divRef.current!, {
          automaticLayout: true,
          language: 'sql',
          minimap: {
            enabled: false,
          },
          value: '',
        });
      });
    }
    return () => editor?.dispose();
  }, [divRef.current]);

  // Setup submit query action
  useEffect(() => {
    if (editor) {
      const action = editor.addAction({
        id: 'submit-selected-query',
        label: 'Submit Selected Query',
        keybindings: [
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        ],
        run: (editor) => {
          const model = editor.getModel();
          if (!model || !onSubmit) {
            return;
          }
  
          const selection = editor.getSelection();
          if (!selection || selection.isEmpty()) {
            onSubmit(model.getValue());
          } else {
            onSubmit(model.getValueInRange(selection));
          }
        },
      });
      return () => action.dispose();
    }
  }, [editor, onSubmit]);

  // Setup value change trigger
  useEffect(() => {
    if (editor) {
      const trigger = editor.onDidChangeModelContent(() => {
        onChange?.(editor.getValue() || '');
      });

      return () => trigger.dispose();
    }
  }, [editor, onChange]);

  return <div ref={divRef} style={{ height: '100%', width: '100%' }} />
};