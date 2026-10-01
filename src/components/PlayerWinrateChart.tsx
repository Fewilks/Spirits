import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Member, MatchRecord } from '../types';
import PokemonSprite from './PokemonSprite';
import { Trophy, TrendingUp, Target, Award, PieChart as PieChartIcon } from 'lucide-react';

interface PlayerWinrateChartProps {
  currentMember: Member;
  allMatches: MatchRecord[];
  filteredMatches?: MatchRecord[];
}

interface ChartDataPoint {
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
        // From player 2's perspective
        if (m.result === 'win') losses++;
        else if (m.result === 'loss') wins++;
        else draws++;
      }
    });

    const totalFromMatches = wins + losses + draws;
    // Fallback to currentMember stats if no matches are found in match history
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

  const data: ChartDataPoint[] = [
    {
      name: 'Vitórias',
      value: activeStats.wins,
      color: '#10b981', // emerald-500
      percentage: activeStats.total > 0 ? Math.round((activeStats.wins / activeStats.total) * 100) : 0
    },
    {
      name: 'Derrotas',
      value: activeStats.losses,
      color: '#f43f5e', // rose-500
      percentage: activeStats.total > 0 ? Math.round((activeStats.losses / activeStats.total) * 100) : 0
    },
    {
      name: 'Empates',
      value: activeStats.draws,
      color: '#94a3b8', // slate-400
      percentage: activeStats.total > 0 ? Math.round((activeStats.draws / activeStats.total) * 100) : 0
    }
  ].filter(d => d.value > 0);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs">
          <div className="flex items-center gap-2 font-bold mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-white">{item.name}</span>
          </div>
          <div className="text-slate-300">
            Quantidade: <strong className="text-white font-mono">{item.value}</strong>
          </div>
          <div className="text-slate-300">
            Proporção: <strong className="text-white font-mono">{item.percentage}%</strong>
          </div>
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

      {/* Main Content: Recharts Pie Chart + Metrics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left / Center: Interactive Recharts Pie Chart */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          {activeStats.total > 0 ? (
            <div className="relative w-full max-w-[260px] h-[210px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="#0f172a"
                    strokeWidth={2}
                    animationDuration={800}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Donut Center Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-white font-mono tracking-tight">
                  {activeStats.winrate}%
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Winrate
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full h-[180px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
              <Trophy className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-400">Nenhuma partida registrada</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Cadastre confrontos ou sincronize logs do PTCGL para visualizar o gráfico.
              </p>
            </div>
          )}
        </div>

        {/* Right: Detailed Metric Cards and Distribution Breakdown */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-3.5">
          {/* Top Quick Badges */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Wins */}
            <div className="bg-emerald-950/30 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl p-3 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Vitórias</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-black text-emerald-300 font-mono">
                  {activeStats.wins}
                </span>
                <span className="text-[11px] text-emerald-400/80 font-mono">
                  ({activeStats.total > 0 ? Math.round((activeStats.wins / activeStats.total) * 100) : 0}%)
                </span>
              </div>
            </div>

            {/* Losses */}
            <div className="bg-rose-950/30 border border-rose-500/20 hover:border-rose-500/40 rounded-xl p-3 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Derrotas</span>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-black text-rose-300 font-mono">
                  {activeStats.losses}
                </span>
                <span className="text-[11px] text-rose-400/80 font-mono">
                  ({activeStats.total > 0 ? Math.round((activeStats.losses / activeStats.total) * 100) : 0}%)
                </span>
              </div>
            </div>

            {/* Draws */}
            <div className="bg-slate-800/40 border border-slate-700/40 hover:border-slate-600/50 rounded-xl p-3 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Empates</span>
                <span className="w-2 h-2 rounded-full bg-slate-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-200 font-mono">
                  {activeStats.draws}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({activeStats.total > 0 ? Math.round((activeStats.draws / activeStats.total) * 100) : 0}%)
                </span>
              </div>
            </div>
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
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${activeStats.total > 0 ? (activeStats.wins / activeStats.total) * 100 : 0}%` }}
                  title={`Vitórias: ${activeStats.wins}`}
                />
                <div 
                  className="bg-rose-500 h-full transition-all duration-500" 
                  style={{ width: `${activeStats.total > 0 ? (activeStats.losses / activeStats.total) * 100 : 0}%` }}
                  title={`Derrotas: ${activeStats.losses}`}
                />
                <div 
                  className="bg-slate-400 h-full transition-all duration-500" 
                  style={{ width: `${activeStats.total > 0 ? (activeStats.draws / activeStats.total) * 100 : 0}%` }}
                  title={`Empates: ${activeStats.draws}`}
                />
              </div>
            </div>
          )}

          {/* Quick info footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-800/80">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Target className="w-3.5 h-3.5 text-purple-400" />
              <span>Desempenho calculado para <strong>{currentMember.name}</strong></span>
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
