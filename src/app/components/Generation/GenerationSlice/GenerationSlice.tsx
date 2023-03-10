import { APIClient } from "@/services/APIClient";
import { isAPIResponse } from "@/utils/isAPIResponse";
import Image from "next/image";
import { ChangeEvent, useRef, useState } from "react";
import { GenerationLoader } from "./GenerationSliceLoader/GenerationSliceLoader";
import styles from "./GenerationSlice.module.css";
import { GenerationSliceToolbar } from "./GenerationSliceToolbar/GenerationSliceToolbar";

type Props = {
  initialContent: string;
  handleDeleteSlice: () => void;
  sliceId: string;
  handleUpdateSlice: (Params: { sliceId: string; content: string }) => void;
};

export type TextContentState = {
  currentText: string;
  newText: string | null;
};

export function GenerationSlice({
  initialContent,
  handleDeleteSlice,
  handleUpdateSlice,
  sliceId
}: Props) {
  const [sliceContent, setSliceContent] = useState<TextContentState>({
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
      prompt: sliceContent.currentText
    });

    if (isAPIResponse(summarizedTextData)) {
      setSliceContent(({ currentText }) => {
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
      prompt: sliceContent.currentText
    });

    if (isAPIResponse(regeneratedTextData)) {
      setSliceContent(({ currentText }) => {
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
      prompt: sliceContent.currentText
    });

    if (isAPIResponse(extendedTextData)) {
      setSliceContent(({ currentText }) => {
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

      $slice.textContent = sliceContent.currentText;

      setSliceContent(currentState => {
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
    setSliceContent(currentState => {
      if (textToEdit) {
        const updatedText = textToEdit;
        handleUpdateSlice({ content: updatedText, sliceId });

        return { newText: null, currentText: updatedText };
      }

      if (currentState.newText) {
        const updatedText = currentState.newText;
        handleUpdateSlice({ content: updatedText, sliceId });

        return { currentText: updatedText, newText: null };
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
    setSliceContent(currentState => {
      return { ...currentState, newText: null };
    });

    const $slice = sliceRef.current;

    setTextToEdit("");
    if ($slice) {
      $slice.textContent = "";
      $slice.contentEditable = "false";
    }
  };

  return (
    <div onInput={handleTextChange} className={styles.generationSlice}>
      {loading ? (
        <>
          <GenerationLoader />
          <p className={styles.generationSlice__loadingPgph} ref={sliceRef}>
            {sliceContent.currentText.trim()}
          </p>
        </>
      ) : (
        <>
          <p className={styles.generationSlice__pgph}>
            {sliceContent.currentText.trim()}
          </p>
          <div className={styles.generationSlice__newPgphCont}>
            <p ref={sliceRef}>{sliceContent.newText?.trim()}</p>

            {sliceContent.newText && (
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
                    src="/svg/delete.svg"
                    alt="discard changes"
                    width={40}
                    height={40}
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
        textContent={sliceContent}
      />
    </div>
  );
}
