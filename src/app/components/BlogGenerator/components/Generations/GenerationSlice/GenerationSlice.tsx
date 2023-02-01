import { APIClient } from "@/services/APIClient";
import { isAPIResponse } from "@/utils/isAPIResponse";
import Image from "next/image";
import { ChangeEvent, useRef, useState } from "react";
import { GenerationLoader } from "./GenerationLoader/GenerationLoader";
import styles from "./GenerationSlice.module.css";
import { GenerationSliceToolbar } from "./GenerationSliceToolbar/GenerationSliceToolbar";

type Props = {
  initialContent: string;
  handleDeleteSlice: () => void;
};

export type TextContentState = {
  currentText: string;
  newText: string | null;
};

export function GenerationSlice({ initialContent, handleDeleteSlice }: Props) {
  const [textContent, setTextContent] = useState<TextContentState>({
    currentText: initialContent,
    newText: null
  });

  const [textToEdit, setTextToEdit] = useState("");

  const [loading, setLoading] = useState(false);

  const sliceRef = useRef<HTMLParagraphElement>(null);

  const handleSummarizeText = async () => {
    setLoading(true);
    const summarizedTextData = await APIClient({
      action: "SUMMARIZE",
      prompt: textContent.currentText
    });

    if (isAPIResponse(summarizedTextData)) {
      setTextContent(({ currentText }) => {
        return {
          currentText,
          newText: summarizedTextData.body.generations[0].text
            .trim()
            .replaceAll("-", "")
        };
      });
    }
    setLoading(false);
  };

  const handleRegenerateText = async () => {
    setLoading(true);
    const regeneratedTextData = await APIClient({
      action: "REGENERATE",
      prompt: textContent.currentText
    });

    if (isAPIResponse(regeneratedTextData)) {
      setTextContent(({ currentText }) => {
        return {
          currentText,
          newText: regeneratedTextData.body.generations[0].text
            .trim()
            .replaceAll("-", "")
        };
      });
    }
    setLoading(false);
  };

  const handleExtendText = async () => {
    setLoading(true);
    const extendedTextData = await APIClient({
      action: "EXTEND",
      prompt: textContent.currentText
    });

    if (isAPIResponse(extendedTextData)) {
      setTextContent(({ currentText }) => {
        const extendedText = extendedTextData.body.generations[0].text;

        return {
          currentText,
          newText: `${currentText}\n${extendedText?.trim().replaceAll("-", "")}`
        };
      });
    }
    setLoading(false);
  };

  const handleEditText = () => {
    const $slice = sliceRef.current;
    if ($slice) {
      $slice.contentEditable = "true";
      $slice.focus();

      $slice.textContent = textContent.currentText;

      setTextContent(currentState => {
        return { ...currentState, newText: currentState.currentText };
      });
    }
  };

  const handleTextChange = async (e: ChangeEvent<HTMLParagraphElement>) => {
    if (e.target.textContent) {
      setTextToEdit(e.target.textContent);
    }
  };

  const handleAcceptNewText = () => {
    setTextContent(currentState => {
      if (textToEdit) {
        return { newText: null, currentText: textToEdit };
      }

      if (currentState.newText) {
        return { currentText: currentState.newText, newText: null };
      }

      return currentState;
    });

    setTextToEdit("");
    const $editPgph = sliceRef.current;

    if ($editPgph) {
      $editPgph.textContent = "";
      $editPgph.contentEditable = "false";
    }
  };

  const handleDiscardNewText = () => {
    const $slice = sliceRef.current;

    if ($slice?.textContent) {
      $slice.textContent = "";
    }

    setTextContent(currentState => {
      return { ...currentState, newText: null };
    });
  };

  return (
    <div onInput={handleTextChange} className={styles.generationSlice}>
      {loading ? (
        <>
          <GenerationLoader />
          <p className={styles.generationSlice__loadingPgph} ref={sliceRef}>
            {textContent.currentText.trim()}
          </p>
        </>
      ) : (
        <>
          <p className={styles.generationSlice__pgph}>
            {textContent.currentText.trim()}
          </p>
          <div className={styles.generationSlice__newPgphCont}>
            <p ref={sliceRef}>{textContent.newText}</p>

            {textContent.newText && (
              <nav className={styles.generationSlice__newPgphCont__navbar}>
                <button
                  className={
                    styles.generationSlice__newPgphCont__navbar__acceptChangesBtn
                  }
                  onClick={handleAcceptNewText}
                >
                  Accept changes
                  <Image
                    src="/svg/accept.svg"
                    alt="accept changes"
                    width={30}
                    height={30}
                  />
                </button>
                <button
                  className={
                    styles.generationSlice__newPgphCont__navbar__discardChangesBtn
                  }
                  onClick={handleDiscardNewText}
                >
                  Discard changes
                  <Image
                    src="/svg/trash.svg"
                    alt="discard changes"
                    width={30}
                    height={30}
                  />
                </button>
              </nav>
            )}
          </div>
        </>
      )}

      <GenerationSliceToolbar
        handleDeleteSlice={handleDeleteSlice}
        handleEditText={handleEditText}
        handleExtendText={handleExtendText}
        handleRegenerateText={handleRegenerateText}
        handleSummarizeText={handleSummarizeText}
        loading={loading}
        textContent={textContent}
      />
    </div>
  );
}
