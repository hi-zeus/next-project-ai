"use client";

import { useState, useEffect, useRef } from "react";
import ILevel from "../levels/(models)/level.interface";
import IScore from "../level/[id]/(models)/Score.interface";
import { getScoresCache, getLevelCache } from "../(caching)/cache";
import { MdShare } from "react-icons/md";
import html2canvas from "html2canvas";
import BackButton from "../(components)/BackButton";
import _ from "lodash";
import { isMobile } from "react-device-detect";

interface StatItem {
  title: string;
  content: string;
}

export default function ResultPage() {
  const [scores, setScores] = useState<IScore[]>([]);
  const [level, setLevel] = useState<ILevel>();
  const [total, setTotal] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const screenshotRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    const scores = getScoresCache();
    const level = getLevelCache();
    scores && setScores(scores);
    level && setLevel(level);
    var total = 0;
    var totalScore = 0;
    for (let score of scores ?? []) {
      total += score.completion;
      totalScore += _.round(
        score.difficulty * (1 / score.completion) * 1000,
        2
      );
    }
    setTotal(total);
    setTotalScore(totalScore);
  }, []);

  const b64toBlob = (b64Data: string, contentType = "", sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  };

  const share = () => {
    if (screenshotRef.current && level) {
      html2canvas(screenshotRef.current, {
        scale: 3.3,
        allowTaint: true,
        backgroundColor: "#4c453e",
      }).then((canvas) => {
        var link = document.createElement("a");
        const href = canvas
          .toDataURL("image/jpeg")
          .replace("image/jpeg", "image/octet-stream");
        link.href = href;
        const downloadName = `taboo-ai_[${
          level.name
        }]_scores_${Date.now()}.jpg`;
        link.download = downloadName;
        console.log(href);

        // link.click();
        if (navigator.share) {
          navigator
            .share({
              title: downloadName,
              text: "Share the scores with friend!",
              files: [
                new File(
                  [b64toBlob(href.split(",")[1], "image/octet-stream")],
                  downloadName,
                  {
                    type: "image/jpeg",
                  }
                ),
              ],
            })
            .then(() => console.log("Shared"))
            .catch((error) => {
              console.log("Error sharing:", error);
              link.click();
            });
        } else {
          link.click();
        }
      });
    }
  };

  const getDifficulty = (difficulty: number): string => {
    switch (difficulty) {
      case 1:
        return "Easy";
      case 2:
        return "Medium";
      case 3:
        return "Hard";
      default:
        return "Unknown";
    }
  };

  const generateMobileStatsRow = (title: string, content: string) => {
    return (
      <div key={title} className="p-3">
        <span className="font-extrabold text-black border-b-2 border-black dark:text-neon-blue dark:border-neon-blue">
          {title}
        </span>
        <p>{content}</p>
      </div>
    );
  };

  const calculateScore = (score: IScore): number => {
    return _.round(score.difficulty * (1000 / score.completion), 2);
  };

  const generateStatsItems = (score: IScore): StatItem[] => {
    return [
      { title: "Your Question", content: score.question },
      { title: "AI's Response", content: score.response },
      {
        title: "Difficulty Point",
        content: `${getDifficulty(score.difficulty)} - ${score.difficulty}`,
      },
      { title: "Total Time Taken", content: `${score.completion} seconds` },
      {
        title: "Score Calculation",
        content: `${score.difficulty} * (1 / ${
          score.completion
        }) x 1000 = ${calculateScore(score)}`,
      },
    ];
  };

  const generateMobileScoreStack = (score: IScore) => {
    return (
      <div
        key={score.id}
        className="border-2 border-white bg-white text-black flex flex-col gap-2 rounded-2xl dark:border-neon-red dark:bg-neon-gray dark:text-neon-white"
      >
        <div className="bg-black dark:bg-neon-black dark:drop-shadow-xl text-white p-3 rounded-2xl flex flex-row justify-between">
          <span>{score.target}</span>
          <span className="font-extrabold">Score: {calculateScore(score)}</span>
        </div>
        {generateStatsItems(score).map((item) => {
          return generateMobileStatsRow(item.title, item.content);
        })}
      </div>
    );
  };

  const renderMobile = () => {
    return (
      <div className="w-full mt-16 flex flex-col gap-6 justify- px-6">
        <div className="text-center flex justify-center items-center">
          <span className="dark:bg-neon-gray bg-black rounded-2xl p-3 dark:border-neon-white border-2 drop-shadow-lg">
            Topic: {level?.name}
          </span>
        </div>
        <div className="p-2 dark:border-neon-yellow dark:border-4 rounded-2xl bg-white text-black dark:bg-neon-white dark:text-neon-gray flex flex-col gap-2 justify-center">
          <div className="flex flex-row justify-between">
            <span>Total Time Taken: </span>
            <span className="font-extrabold">{total} seconds</span>
          </div>
          <div className="flex flex-row justify-between">
            <span>Total Score:</span>
            <span className="font-extrabold">{_.round(totalScore, 2)}</span>
          </div>
        </div>
        {scores.map((score) => {
          return generateMobileScoreStack(score);
        })}
      </div>
    );
  };

  const renderDesktop = () => {
    const headers = [
      "Index",
      "Taboo Word",
      "Your Question",
      "AI's Response",
      "Difficulty",
      "Time Taken",
      "Score (Difficulty x (1/Time Taken) x 1000)",
    ];
    return (
      <div className="w-full max-h-[70%] h-[70%] text-center">
        <div className="font-mono relative my-16 lg:my-20 mx-4 rounded-xl lg:rounded-3xl h-full bg-white dark:bg-neon-black overflow-scroll scrollbar-hide border-4 border-white dark:border-neon-green">
          <table className="relative table-fixed min-w-[1024px]">
            <thead className="sticky top-0 font-semibold uppercase bg-black text-white dark:bg-neon-gray dark:text-neon-white h-24 rounded-t-xl lg:rounded-t-3xl">
              <tr>
                {headers.map((header, idx) => (
                  <th
                    className={`px-4 pb-2 pt-4 font-semibold text-left text-xs lg:text-xl ${
                      idx == 2
                        ? "w-3/12"
                        : idx == 3
                        ? "w-3/12"
                        : idx == 6
                        ? "w-3/12"
                        : "w-1/12"
                    }`}
                    key={header}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y text-left text-xs lg:text-xl text-gray bg-white dark:text-neon-white dark:bg-neon-black">
              <tr className="sticky top-24 left-0 ">
                <td
                  colSpan={7}
                  className="w-full h-12 text-xl lg:text-3xl text-white-faded bg-white dark:text-neon-red dark:bg-neon-black"
                >
                  {" "}
                  Topic:{" "}
                  <span className="text-black dark:text-neon-white">
                    {level?.name}
                  </span>
                </td>
              </tr>
              {scores.map((score) => (
                <tr key={score.id}>
                  <td className="p-3 font-medium">{score.id}</td>
                  <td className="p-3 font-medium">{score.target}</td>
                  <td className="p-3 font-medium">{score.question}</td>
                  <td className="p-3 font-medium">{score.response}</td>
                  <td className="p-3 font-medium">{score.difficulty}</td>
                  <td className="p-3 font-medium">
                    {score.completion} seconds
                  </td>
                  <td className="p-3 font-medium">
                    {score.difficulty} x 1/{score.completion} (seconds) x 1000 ={" "}
                    {_.round(
                      score.difficulty * (1 / score.completion) * 1000,
                      2
                    )}
                  </td>
                </tr>
              ))}
              <tr>
                <td
                  colSpan={5}
                  className="px-3 pt-4 pb-8 border-collapse font-extrabold"
                >
                  Total Time Taken
                </td>
                <td colSpan={2} className="px-3 pt-4 pb-8 font-extrabold">
                  {total} seconds
                </td>
              </tr>
              <tr>
                <td
                  colSpan={6}
                  className="px-3 pt-4 pb-8 border-collapse font-extrabold"
                >
                  Total Score
                </td>
                <td className="px-3 pt-4 pb-8 font-extrabold">{totalScore}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      <BackButton href="/levels" />
      <h1 className="fixed top-0 w-full h-14 py-4 text-lg lg:text-3xl text-center bg-black dark:bg-neon-black z-10">
        Scoreboard
      </h1>
      <section ref={screenshotRef}>
        {isMobile ? renderMobile() : renderDesktop()}
      </section>
      <button
        id="share"
        className="text-xl lg:text-3xl fixed top-5 right-4 lg:right-10 hover:opacity-50 transition-all ease-in-out z-40"
        onClick={share}
      >
        <MdShare />
      </button>
    </>
  );
}
