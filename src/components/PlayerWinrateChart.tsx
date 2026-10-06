import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Member, MatchRecord } from '../types';
import PokemonSprite from './PokemonSprite';
import { 
  Trophy, 
  XCircle, 
  MinusCircle, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Target, 
  Award, 
  PieChart as PieChartIcon,
  SlidersHorizontal
} from 'lucide-react';

interface PlayerWinrateChartProps {
  currentMember: Member;
  allMatches: MatchRecord[];
  filteredMatches?: MatchRecord[];
}

type CategoryKey = 'win' | 'loss' | 'draw';

interface LegendCategoryConfig {
  key: CategoryKey;
  name: string;
  value: number;
  color: string;
  borderColor: string;
  activeBg: string;
  textColor: string;
  icon: React.ReactNode;
}

interface ChartDataPoint {
  key: CategoryKey;
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export default function PlayerWinrateChart({
  currentMember,
  allMatches,
  filteredMatches
}: PlayerWinrateChartProps) {
  const [dataScope, setDataScope] = useState<'all' | 'filtered'>('all');

  // Estado para alternar a visibilidade de cada categoria (Vitória, Derrota, Empate)
  const [visibleCategories, setVisibleCategories] = useState<Record<CategoryKey, boolean>>({
    win: true,
    loss: true,
    draw: true,
  });

  // Alterna visibilidade de uma categoria específica
  const handleToggleCategory = (key: CategoryKey) => {
    setVisibleCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Restaura todas as categorias para visíveis
  const handleShowAllCategories = () => {
    setVisibleCategories({
      win: true,
      loss: true,
      draw: true,
    });
  };

  // Compute stats for current member
  const computeStats = (matchList: MatchRecord[]) => {
    let wins = 0;
    let losses = 0;
    let draws = 0;

    matchList.forEach(m => {
      if (m.player1Id === currentMember.id) {
        if (m.result === 'win') wins++;
        else if (m.result === 'loss') losses++;
        else draws++;
      } else if (m.player2IsMember && m.player2Id === currentMember.id) {
        // Perspectiva do jogador 2
        if (m.result === 'win') losses++;
        else if (m.result === 'loss') wins++;
        else draws++;
      }
    });

    const totalFromMatches = wins + losses + draws;
    // Fallback para os dados do próprio membro se não houver registros detalhados de partidas
    const finalWins = totalFromMatches > 0 ? wins : (currentMember.wins || 0);
    const finalLosses = totalFromMatches > 0 ? losses : (currentMember.losses || 0);
    const finalDraws = totalFromMatches > 0 ? draws : (currentMember.draws || 0);
    const total = finalWins + finalLosses + finalDraws;

    return {
      wins: finalWins,
      losses: finalLosses,
      draws: finalDraws,
      total,
      winrate: total > 0 ? Math.round((finalWins / total) * 100) : 0,
      hasDirectMatches: totalFromMatches > 0
    };
  };

  const allStats = computeStats(allMatches);
  const filteredStats = filteredMatches ? computeStats(filteredMatches) : allStats;
  const activeStats = dataScope === 'filtered' && filteredMatches ? filteredStats : allStats;

  // Configuração das três categorias com seus ícones e estilos
  const categories: LegendCategoryConfig[] = [
    {
      key: 'win',
      name: 'Vitórias',
      value: activeStats.wins,
      color: '#10b981', // emerald-500
      borderColor: 'border-emerald-500/40',
      activeBg: 'bg-emerald-950/40 hover:bg-emerald-900/50',
      textColor: 'text-emerald-400',
      icon: <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
    },
    {
      key: 'loss',
      name: 'Derrotas',
      value: activeStats.losses,
      color: '#f43f5e', // rose-500
      borderColor: 'border-rose-500/40',
      activeBg: 'bg-rose-950/40 hover:bg-rose-900/50',
      textColor: 'text-rose-400',
      icon: <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
    },
    {
      key: 'draw',
      name: 'Empates',
      value: activeStats.draws,
      color: '#94a3b8', // slate-400
      borderColor: 'border-slate-500/40',
      activeBg: 'bg-slate-800/40 hover:bg-slate-700/50',
      textColor: 'text-slate-300',
      icon: <MinusCircle className="w-4 h-4 text-slate-400 shrink-0" />
    }
  ];

  // Dados calculados para cada categoria
  const allCategoryData: ChartDataPoint[] = categories.map(cat => ({
    key: cat.key,
    name: cat.name,
    value: cat.value,
    color: cat.color,
    percentage: activeStats.total > 0 ? Math.round((cat.value / activeStats.total) * 100) : 0
  }));

  // Fatias ativas no gráfico de pizza conforme seleção do usuário na legenda
  const activeChartData = allCategoryData.filter(d => visibleCategories[d.key] && d.value > 0);
  
  const hasHiddenCategories = Object.values(visibleCategories).some(v => !v);
  const activeVisibleTotal = activeChartData.reduce((acc, curr) => acc + curr.value, 0);

  // Chave dinâmica para acionar animação de entrada 'fade-in' e escala suave ao carregar ou alterar dados
  const chartAnimationKey = `chart-${dataScope}-${activeChartData.map(d => `${d.key}:${d.value}`).join('_')}`;

  // Custom Recharts Tooltip com design dark theme
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs pointer-events-none">
          <div className="flex items-center gap-2 font-bold mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-white">{item.name}</span>
          </div>
          <div className="text-slate-300">
            Quantidade: <strong className="text-white font-mono">{item.value}</strong>
          </div>
          <div className="text-slate-300">
            Proporção Global: <strong className="text-white font-mono">{item.percentage}%</strong>
          </div>
          {activeVisibleTotal !== activeStats.total && activeVisibleTotal > 0 && (
            <div className="text-purple-300 text-[10px] mt-0.5 font-mono">
              Fatia visível: {Math.round((item.value / activeVisibleTotal) * 100)}%
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      id="player-winrate-visualization"
      className="bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-purple-950/20 border border-slate-800 hover:border-purple-500/30 transition-all rounded-2xl p-5 shadow-xl"
    >
      {/* Top Header of the visualization */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <PokemonSprite
              name={currentMember.avatarSprite || 'pikachu'}
              className="w-12 h-12 bg-slate-950/80 rounded-xl p-1 border border-slate-700/60 shadow-inner"
            />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[9px] font-bold text-white border border-slate-900">
              ★
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                {currentMember.nickname || currentMember.name}
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {currentMember.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <PieChartIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>Distribuição de Resultados & Taxa de Vitória</span>
            </p>
          </div>
        </div>

        {/* Scope selector: All vs Filtered */}
        {filteredMatches && filteredMatches.length !== allMatches.length && (
          <div className="flex items-center bg-slate-950/80 border border-slate-800 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setDataScope('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                dataScope === 'all'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Geral ({allStats.total})
            </button>
            <button
              type="button"
              onClick={() => setDataScope('filtered')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                dataScope === 'filtered'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Filtro Atual ({filteredStats.total})
            </button>
          </div>
        )}
      </div>

      {/* Main Content: Recharts Pie Chart with Custom Side Legend + Metrics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Recharts Pie Chart alongside Custom Side Legend */}
        <div className="lg:col-span-7 bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-850">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
              <span>Gráfico de Pizza & Legenda Interativa</span>
            </span>

            {hasHiddenCategories && (
              <button
                type="button"
                onClick={handleShowAllCategories}
                className="px-2 py-0.5 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-700/50 text-purple-300 text-[11px] font-semibold rounded-md flex items-center gap-1 cursor-pointer transition-all"
                title="Restaurar todas as categorias no gráfico"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar Legenda</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-auto">
            {/* The Donut Pie Chart com animação fade-in e escala suave */}
            <div 
              key={chartAnimationKey}
              className="animate-chart-enter relative w-[190px] h-[190px] shrink-0 flex items-center justify-center transition-all duration-300"
            >
              {activeStats.total > 0 && activeChartData.length > 0 ? (
                <>
                  <ResponsiveContainer width={190} height={190}>
                    <PieChart>
                      <Tooltip content={<CustomTooltip />} />
                      <Pie
                        data={activeChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={82}
                        paddingAngle={activeChartData.length > 1 ? 4 : 0}
                        dataKey="value"
                        stroke="#0f172a"
                        strokeWidth={2}
                        isAnimationActive={true}
                        animationBegin={40}
                        animationDuration={700}
                        animationEasing="ease-out"
                      >
                        {activeChartData.map((entry) => (
                          <Cell 
                            key={`cell-${entry.key}`} 
                            fill={entry.color}
                            className="cursor-pointer transition-transform duration-300 hover:scale-105"
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Donut Center Display com animação de fade-in suave */}
                  <div 
                    key={`center-${chartAnimationKey}`}
                    className="animate-fade-in absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center"
                  >
                    <span className="text-2xl font-black text-white font-mono tracking-tight leading-none">
                      {activeStats.winrate}%
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
                      Winrate
                    </span>
                    {hasHiddenCategories && (
                      <span className="text-[9px] text-purple-400 font-semibold font-mono">
                        (Filtrado)
                      </span>
                    )}
                  </div>
                </>
              ) : activeStats.total > 0 && activeChartData.length === 0 ? (
                <div className="animate-chart-enter w-full h-full flex flex-col items-center justify-center text-center p-3 border border-dashed border-slate-800 rounded-full bg-slate-900/30">
                  <EyeOff className="w-6 h-6 text-slate-500 mb-1" />
                  <span className="text-[11px] font-bold text-slate-400">Todas ocultas</span>
                  <button
                    type="button"
                    onClick={handleShowAllCategories}
                    className="text-[10px] text-purple-400 hover:text-purple-300 font-bold underline mt-1 cursor-pointer"
                  >
                    Exibir todas
                  </button>
                </div>
              ) : (
                <div className="animate-chart-enter w-full h-full flex flex-col items-center justify-center text-center p-3 border border-dashed border-slate-800 rounded-full bg-slate-900/30">
                  <Trophy className="w-6 h-6 text-slate-600 mb-1" />
                  <span className="text-[11px] font-bold text-slate-400">Sem partidas</span>
                </div>
              )}
            </div>

            {/* Custom Side Legend with Toggle Functionality */}
            <div className="flex flex-col gap-2.5 w-full sm:w-auto min-w-[210px]" id="pie-chart-custom-legend">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
                <span>Clique para alternar:</span>
                <span className="text-slate-500 font-mono">
                  {Object.values(visibleCategories).filter(Boolean).length}/3 visíveis
                </span>
              </div>

              {categories.map(cat => {
                const isVisible = visibleCategories[cat.key];
                const percent = activeStats.total > 0 ? Math.round((cat.value / activeStats.total) * 100) : 0;

                return (
                  <button
                    key={`legend-btn-${cat.key}`}
                    id={`legend-toggle-${cat.key}`}
                    type="button"
                    onClick={() => handleToggleCategory(cat.key)}
                    className={`group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-all text-xs cursor-pointer text-left select-none ${
                      isVisible
                        ? `${cat.activeBg} ${cat.borderColor} text-white shadow-sm ring-1 ring-white/5`
                        : 'bg-slate-950/40 border-slate-850 text-slate-500 opacity-45 hover:opacity-75 hover:border-slate-700'
                    }`}
                    title={isVisible ? `Clique para ocultar ${cat.name} do gráfico` : `Clique para exibir ${cat.name} no gráfico`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1 rounded-lg transition-all ${
                        isVisible ? 'bg-slate-900/90' : 'bg-slate-900/40 grayscale'
                      }`}>
                        {cat.icon}
                      </div>
                      <div>
                        <div className={`font-bold transition-all ${
                          isVisible ? 'text-slate-100' : 'line-through text-slate-500'
                        }`}>
                          {cat.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {percent}% do total
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span className={`text-sm font-black transition-all ${
                        isVisible ? cat.textColor : 'text-slate-500'
                      }`}>
                        {cat.value}
                      </span>
                      <span className="p-1 rounded-md bg-slate-950/70 border border-slate-800 text-slate-400 group-hover:text-white transition-colors">
                        {isVisible ? (
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}

              <p className="text-[10px] text-slate-500 italic mt-0.5">
                💡 Clique em qualquer resultado para ocultar/exibir sua fatia.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Metric Cards and Distribution Breakdown */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3.5">
          {/* Top Quick Badges (also interactive with the toggle) */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Wins */}
            <button
              type="button"
              onClick={() => handleToggleCategory('win')}
              className={`rounded-xl p-3 transition-all text-left cursor-pointer border ${
                visibleCategories.win
                  ? 'bg-emerald-950/30 border-emerald-500/30 hover:border-emerald-500/60 shadow-sm'
                  : 'bg-slate-950/40 border-slate-850 opacity-50 hover:opacity-80'
              }`}
              title="Clique para alternar visibilidade no gráfico"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  visibleCategories.win ? 'text-emerald-400' : 'text-slate-500 line-through'
                }`}>
                  Vitórias
                </span>
                <span className={`w-2 h-2 rounded-full ${visibleCategories.win ? 'bg-emerald-500 ring-2 ring-emerald-500/30' : 'bg-slate-600'}`} />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className={`text-xl font-black font-mono ${
                  visibleCategories.win ? 'text-emerald-300' : 'text-slate-500'
                }`}>
                  {activeStats.wins}
                </span>
                <span className="text-[11px] text-emerald-400/80 font-mono">
                  ({activeStats.total > 0 ? Math.round((activeStats.wins / activeStats.total) * 100) : 0}%)
                </span>
              </div>
            </button>

            {/* Losses */}
            <button
              type="button"
              onClick={() => handleToggleCategory('loss')}
              className={`rounded-xl p-3 transition-all text-left cursor-pointer border ${
                visibleCategories.loss
                  ? 'bg-rose-950/30 border-rose-500/30 hover:border-rose-500/60 shadow-sm'
                  : 'bg-slate-950/40 border-slate-850 opacity-50 hover:opacity-80'
              }`}
              title="Clique para alternar visibilidade no gráfico"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  visibleCategories.loss ? 'text-rose-400' : 'text-slate-500 line-through'
                }`}>
                  Derrotas
                </span>
                <span className={`w-2 h-2 rounded-full ${visibleCategories.loss ? 'bg-rose-500 ring-2 ring-rose-500/30' : 'bg-slate-600'}`} />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className={`text-xl font-black font-mono ${
                  visibleCategories.loss ? 'text-rose-300' : 'text-slate-500'
                }`}>
                  {activeStats.losses}
                </span>
                <span className="text-[11px] text-rose-400/80 font-mono">
                  ({activeStats.total > 0 ? Math.round((activeStats.losses / activeStats.total) * 100) : 0}%)
                </span>
              </div>
            </button>

            {/* Draws */}
            <button
              type="button"
              onClick={() => handleToggleCategory('draw')}
              className={`rounded-xl p-3 transition-all text-left cursor-pointer border ${
                visibleCategories.draw
                  ? 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600/80 shadow-sm'
                  : 'bg-slate-950/40 border-slate-850 opacity-50 hover:opacity-80'
              }`}
              title="Clique para alternar visibilidade no gráfico"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  visibleCategories.draw ? 'text-slate-300' : 'text-slate-500 line-through'
                }`}>
                  Empates
                </span>
                <span className={`w-2 h-2 rounded-full ${visibleCategories.draw ? 'bg-slate-400 ring-2 ring-slate-400/30' : 'bg-slate-600'}`} />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className={`text-xl font-black font-mono ${
                  visibleCategories.draw ? 'text-slate-200' : 'text-slate-500'
                }`}>
                  {activeStats.draws}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({activeStats.total > 0 ? Math.round((activeStats.draws / activeStats.total) * 100) : 0}%)
                </span>
              </div>
            </button>
          </div>

          {/* Progress bar showing visual proportion */}
          {activeStats.total > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Total de Combates: <strong className="text-white">{activeStats.total}</strong></span>
                <span>Taxa de Vitória: <strong className="text-emerald-400">{activeStats.winrate}%</strong></span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                <div 
                  className={`h-full transition-all duration-500 ${visibleCategories.win ? 'bg-emerald-500' : 'bg-emerald-500/20'}`} 
                  style={{ width: `${activeStats.total > 0 ? (activeStats.wins / activeStats.total) * 100 : 0}%` }}
                  title={`Vitórias: ${activeStats.wins}`}
                />
                <div 
                  className={`h-full transition-all duration-500 ${visibleCategories.loss ? 'bg-rose-500' : 'bg-rose-500/20'}`} 
                  style={{ width: `${activeStats.total > 0 ? (activeStats.losses / activeStats.total) * 100 : 0}%` }}
                  title={`Derrotas: ${activeStats.losses}`}
                />
                <div 
                  className={`h-full transition-all duration-500 ${visibleCategories.draw ? 'bg-slate-400' : 'bg-slate-400/20'}`} 
                  style={{ width: `${activeStats.total > 0 ? (activeStats.draws / activeStats.total) * 100 : 0}%` }}
                  title={`Empates: ${activeStats.draws}`}
                />
              </div>
            </div>
          )}

          {/* Quick info footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 bg-slate-950/50 px-3 py-2.5 rounded-xl border border-slate-800/80">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Target className="w-3.5 h-3.5 text-purple-400" />
              <span>Desempenho de <strong>{currentMember.name}</strong></span>
            </span>
            {currentMember.officialPoints !== undefined && currentMember.officialPoints > 0 && (
              <span className="flex items-center gap-1 text-amber-300 font-mono font-bold">
                <Award className="w-3 h-3 text-amber-400" />
                <span>{currentMember.officialPoints} CP Oficial</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
