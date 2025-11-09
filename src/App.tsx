import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { VirtualAbacus } from '@/components/Abacus';
import { FireflySwarm } from '@/components/Fireflies';
const WelcomeScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl"
      >
        {/* Firefly animation */}
        <div className="mb-8 relative">
          <motion.div
            animate={{
              y: [-10, 10, -10],
              x: [-5, 5, -5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-8xl firefly-glow-strong inline-block"
          >
            ⭐
          </motion.div>
          <motion.div
            animate={{
              y: [10, -10, 10],
              x: [5, -5, 5],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
            className="text-6xl firefly-glow absolute top-1/2 left-1/4"
          >
            ✨
          </motion.div>
          <motion.div
            animate={{
              y: [-8, 12, -8],
              x: [-3, 7, -3],
            }}
            transition={{
              duration: 4.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="text-5xl firefly-glow absolute top-1/3 right-1/4"
          >
            🌟
          </motion.div>
        </div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-6xl md:text-7xl font-display font-bold mb-4 bg-gradient-to-r from-firefly via-firefly-light to-ocean bg-clip-text text-transparent"
        >
          Светлина
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xl md:text-2xl text-ocean-light mb-8"
        >
          Игра за Ментална Аритметика с Абакус
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-lg text-gray-300 mb-12 max-w-xl mx-auto"
        >
          Присъедини се към роя светулки и стани майстор на ментална аритметика!
          🔥 Научи се да смяташ бързо като светкавица с японския Соробан метод.
        </motion.p>

        {/* Start button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="btn-primary text-xl px-12 py-4"
        >
          Започни Приключението ✨
        </motion.button>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-16 text-sm text-gray-400"
        >
          <p>За деца от 5 до 12 години</p>
          <p className="mt-2">Учебен център "Светлина"</p>
        </motion.div>
      </motion.div>

      {/* Floating fireflies background */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 100,
            opacity: 0
          }}
          animate={{
            y: -100,
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            delay: i * 1.5,
            ease: "linear"
          }}
          className="absolute pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
          }}
        >
          <span className="text-2xl firefly-glow">
            {['🔥', '✨', '⭐', '💫'][Math.floor(Math.random() * 4)]}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

function App() {
  const [gameStarted, setGameStarted] = useState(false);

  if (!gameStarted) {
    return <WelcomeScreen onStart={() => setGameStarted(true)} />;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-display font-bold text-firefly mb-4"
          >
            Светлина - Демо 🎮
          </motion.h1>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setGameStarted(false)}
            className="btn-ghost mt-4"
          >
            ← Назад към начало
          </motion.button>
        </div>

        {/* Firefly Swarm Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <FireflySwarm
            showAll={true}
            size="md"
            activeNumbers={[5, 10]}
            onFireflyClick={(num) => console.log(`Clicked firefly ${num}`)}
          />
        </motion.section>

        {/* Virtual Abacus Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <VirtualAbacus
            columns={5}
            beadSize={32}
            showValue={true}
            interactive={true}
            onValueChange={(value) => console.log(`Abacus value: ${value}`)}
          />
        </motion.section>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="card text-center"
        >
          <h3 className="text-2xl font-display font-bold text-ocean-light mb-4">
            Какво следва? 🚀
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-left mt-8">
            <div className="p-4 bg-forest-light rounded-lg">
              <div className="text-3xl mb-2">🎯</div>
              <h4 className="font-semibold text-firefly mb-2">Игрови Режими</h4>
              <p className="text-sm text-gray-300">
                Flash Anzan, тренировки с формули, предизвикателства и много повече!
              </p>
            </div>
            <div className="p-4 bg-forest-light rounded-lg">
              <div className="text-3xl mb-2">📊</div>
              <h4 className="font-semibold text-firefly mb-2">Прогрес</h4>
              <p className="text-sm text-gray-300">
                Проследяване на статистики, значки, нива и личен рекорд.
              </p>
            </div>
            <div className="p-4 bg-forest-light rounded-lg">
              <div className="text-3xl mb-2">👨‍👩‍👧‍👦</div>
              <h4 className="font-semibold text-firefly mb-2">Родителски Панел</h4>
              <p className="text-sm text-gray-300">
                Родителите могат да следят напредъка на децата си.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default App;
