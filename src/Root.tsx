import React from 'react';
import { Composition } from 'remotion';
import { IntroVideo } from './compositions/IntroVideo';
import { RattleShowcase } from './compositions/RattleShowcase';
import { RattleAIMotion } from './compositions/RattleAIMotion';
import { RattleAIDance } from './compositions/RattleAIDance';
import { RattleAISoccer } from './compositions/RattleAISoccer';
import { SuperChristShowcase } from './compositions/SuperChristShowcase';
import { SuperChristWalkShowcase } from './compositions/SuperChristWalkShowcase';
import { SimpleTest } from './compositions/SimpleTest';
import { LegTest } from './compositions/LegTest';
import lipSyncData from './assets/lipsync.json';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="IntroVideo"
        component={IntroVideo}
        durationInFrames={lipSyncData.totalFrames || 381}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="RattleShowcase"
        component={RattleShowcase}
        durationInFrames={540}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="RattleAIMotion"
        component={RattleAIMotion}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="RattleAIDance"
        component={RattleAIDance}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="RattleAISoccer"
        component={RattleAISoccer}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="SuperChristShowcase"
        component={SuperChristShowcase}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="SuperChristWalkShowcase"
        component={SuperChristWalkShowcase}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="SimpleTest"
        component={SimpleTest}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="LegTest"
        component={LegTest}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};







