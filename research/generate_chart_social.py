import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.size': 12,
    'axes.facecolor': '#f8f9fa',
    'figure.facecolor': '#f8f9fa',
})

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.5))

# ── Left: Fee vs Storage comparison ──
categories = ['Storage\ncost\n(10yr lifetime)', 'Fee\n(low activity)\n1-2 sat/vB', 'Fee\n(moderate)\n10-20 sat/vB', 'Fee\n(peak)\n200+ sat/vB']
values = [0.008, 0.10, 0.85, 25.00]
bar_colors = ['#2ecc71', '#3498db', '#f39c12', '#e74c3c']
bars = ax1.bar(range(len(categories)), values, color=bar_colors, width=0.55, edgecolor='white', linewidth=1.5)
ax1.set_yscale('log')
ax1.set_ylabel('USD per inscription (log scale)', fontsize=11, fontweight='bold')
ax1.set_xticks(range(len(categories)))
ax1.set_xticklabels(categories, fontsize=8.5)
ax1.set_title('What does it cost to store an inscription forever?', fontweight='bold', fontsize=12, pad=12)
ax1.set_ylim(bottom=0.001, top=80)

for bar, val in zip(bars, values):
    ypos = bar.get_height() * 1.15
    label = f'${val:.3f}' if val < 1 else f'${val:.0f}'
    ax1.text(bar.get_x() + bar.get_width()/2, ypos, label,
             ha='center', va='bottom', fontsize=9, fontweight='bold')

# Annotations
ax1.annotate('', xy=(0, 0.008), xytext=(1, 0.10),
             arrowprops=dict(arrowstyle='<->', color='#555', lw=1.8, linestyle=':'))
ax1.text(0.5, 0.025, '~12×', ha='center', fontsize=9, color='#555', fontweight='bold')

ax1.annotate('', xy=(0, 0.008), xytext=(3, 25),
             arrowprops=dict(arrowstyle='<->', color='#555', lw=1.8, linestyle=':'))
ax1.text(1.5, 0.6, '~3,000×', ha='center', fontsize=9, color='#555', fontweight='bold')

ax1.text(0, 0.0035, 'Storage cost is an\nunpriced externality\nthat recurs annually', 
         fontsize=8, color='#666', fontstyle='italic', ha='center')

# ── Right: Node cost breakdown ──
categories2 = ['Hardware', 'Bandwidth', 'Electricity']
values2 = [167, 600, 158]
colors2 = ['#3498db', '#e74c3c', '#2ecc71']
bars2 = ax2.bar(categories2, values2, color=colors2, width=0.55, edgecolor='white', linewidth=1.5)
ax2.set_ylabel('USD per year', fontsize=11, fontweight='bold')
ax2.set_title('Annual Bitcoin Full Node Cost: $925/yr', fontweight='bold', fontsize=12, pad=12)
ax2.set_ylim(bottom=0, top=750)

for bar, val in zip(bars2, values2):
    ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 10,
             f'${val}', ha='center', va='bottom', fontsize=10, fontweight='bold')

ax2.text(0.5, -65,
         '$0.06/inscription fee (current low activity)  vs  $0.008/inscription lifetime storage cost\n'
         'The fee market prices congestion. It does NOT price permanence.',
         ha='center', fontsize=8.5, color='#555', fontstyle='italic',
         transform=ax2.transData)

plt.suptitle('Bitcoin Block Space: The Permanence Externality',
             fontsize=15, fontweight='bold', y=1.02)
fig.text(0.5, -0.02,
         'bitcoinsahi.com  ·  delvingbitcoin.org/t/2750',
         ha='center', fontsize=8, color='#888')

plt.tight_layout()
plt.savefig('/Users/prateekposwal/Desktop/bitcoin-priority-oracle/research/chart_social.png',
            dpi=200, bbox_inches='tight', facecolor='#f8f9fa', pad_inches=0.3)
print("Social chart saved")
