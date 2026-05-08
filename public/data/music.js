/**
 * 疗愈音乐内容库 — 心晴空间
 * 格式：{ id, title, composer, year, duration, bpm, wave, category, tags, description, scenario }
 * wave: 脑波类型 (alpha/theta/delta/beta)
 * category: 音乐类型 (piano/nature/ambient/classical/meditation)
 * scenario: 推荐场景 (morning/noon/evening/sleep)
 */

const MUSIC = [
  // ===== α波（8-13Hz）— 放松专注 =====
  { id: 'm001', title: '晨曦之门', composer: '心晴空间原创', year: 2025, duration: '5:30', bpm: 60, wave: 'alpha', category: 'ambient', tags: ['晨起', '希望', '新生'], description: '轻柔的新世纪风格，以钢琴长音配合弦乐铺底，营造破晓时分的宁静与期待。60 BPM 与 α 波同频，引导大脑进入清醒而放松的状态。', scenario: 'morning' },
  { id: 'm002', title: '森林漫步', composer: 'Aural Flow', year: 2023, duration: '4:45', bpm: 66, wave: 'alpha', category: 'nature', tags: ['自然', '平和', '正念'], description: '采集于挪威森林的白噪音，混合模拟鸟鸣与风声，底层嵌入 432Hz 谐波音叉。自然的节奏帮助副交感神经启动，自然降低皮质醇水平。', scenario: 'morning' },
  { id: 'm003', title: '雨后咖啡馆', composer: 'Lo-Fi Mind', year: 2024, duration: '3:20', bpm: 72, wave: 'alpha', category: 'ambient', tags: ['慵懒', '惬意', '日常'], description: '低保真嘻哈节拍混合雨声与咖啡馆白噪音，适合作为晨间独处的背景音。不打断思维流，同时提供轻柔的节奏锚定感。', scenario: 'morning' },
  { id: 'm004', title: '海浪呼吸', composer: 'Ocean Mind', year: 2022, duration: '8:00', bpm: 54, wave: 'alpha', category: 'nature', tags: ['海洋', '呼吸', '接纳'], description: '以真实海浪声为核心素材，采用「节奏性感官输入」（Binaural Beats）技术，在左右声道嵌入轻微频率差，引导大脑进入 α 波主导状态。', scenario: 'morning' },
  { id: 'm005', title: '百合花园', composer: 'Healing Tones', year: 2023, duration: '5:00', bpm: 63, wave: 'alpha', category: 'piano', tags: ['花园', '温柔', '自我关怀'], description: '独奏钢琴作品，以 E 大调为主调，配合五声音阶旋律走向。曲目结构参考音乐治疗中的「渐入—停留—渐出」三段式，最大化放松效应。', scenario: 'morning' },
  { id: 'm006', title: '午后梦境', composer: 'Dreamscape', year: 2024, duration: '4:20', bpm: 75, wave: 'alpha', category: 'ambient', tags: ['午后', '放松', '轻快'], description: '明快的中板节拍配合合成器音色，适合午后短暂休息时聆听。研究表明，10-15 分钟的中等节奏音乐（70-90 BPM）可有效提升警觉性而不引发焦虑。', scenario: 'noon' },
  { id: 'm007', title: '窗边随想', composer: 'Urban Calm', year: 2023, duration: '3:45', bpm: 80, wave: 'alpha', category: 'ambient', tags: ['城市', '冥想', '独处'], description: '城市环境音（咖啡馆、街道远景）与简约钢琴的融合，呈现「身在城市，心在远方」的意境。适合工作间隙的短暂心理复位。', scenario: 'noon' },
  { id: 'm008', title: '溪流正念', composer: 'Nature Therapy', year: 2022, duration: '6:30', bpm: 60, wave: 'alpha', category: 'nature', tags: ['溪流', '正念', '当下'], description: '阿尔卑斯山溪流声为主音轨，叠加 432Hz 谐波音。曲子设计为开放式循环，无明显开始与结束，让聆听者随时进入而不感到突兀。', scenario: 'noon' },
  { id: 'm009', title: '书桌前的光', composer: 'Focus Flow', year: 2024, duration: '4:00', bpm: 85, wave: 'alpha', category: 'ambient', tags: ['专注', '学习', '工作'], description: '专为深度工作设计的背景音，以稳定的低频持续音（Drone）为基础，配合偶尔出现的自然音效点缀。帮助屏蔽干扰，维持 α 波状态下的流畅专注。', scenario: 'noon' },
  { id: 'm010', title: '静夜如歌', composer: 'Moonlight Studio', year: 2023, duration: '5:15', bpm: 52, wave: 'alpha', category: 'piano', tags: ['夜晚', '沉思', '内省'], description: '深夜钢琴独白，以小调为基础但旋律走向温暖而非悲伤。适合日间情绪波动后的心理整理，在安静中与自己和解。', scenario: 'evening' },
  { id: 'm011', title: '日落海岸', composer: 'Coastal Dreams', year: 2022, duration: '6:00', bpm: 56, wave: 'alpha', category: 'ambient', tags: ['日落', '告别', '放下'], description: '以真实日落时分的海岸录音为基础素材，配合低频持续音。设计理念：帮助大脑优雅地从活跃状态切换到休息状态，减少「入睡焦虑」。', scenario: 'evening' },
  { id: 'm012', title: '星空低语', composer: 'Stargaze', year: 2024, duration: '7:00', bpm: 50, wave: 'alpha', category: 'ambient', tags: ['星空', '宁静', '广阔'], description: '合成器模拟的宇宙空间音效，配合稳定的 α 波频率引导。适合晚间进行认知重评练习时的背景音，营造安全而广阔的心理空间。', scenario: 'evening' },
  { id: 'm013', title: '夜读时分', composer: 'Night Reader', year: 2023, duration: '4:30', bpm: 65, wave: 'alpha', category: 'ambient', tags: ['阅读', '安静', '独处'], description: '为夜间阅读设计的极简背景音，几乎不包含旋律，以环境层次为主。稳定的节拍为翻页和思考提供韵律支撑，同时不干扰文字信息的加工。', scenario: 'evening' },
  { id: 'm014', title: '秋日私语', composer: 'Autumn Breeze', year: 2022, duration: '5:45', bpm: 58, wave: 'alpha', category: 'piano', tags: ['秋天', '怀旧', '温柔'], description: '钢琴与弦乐四重奏的对话，以秋季落叶声采样作为节奏元素。研究显示，与自然音效结合的音乐比纯电子音乐更能激活前额叶皮层的正向情绪区域。', scenario: 'evening' },
  { id: 'm015', title: '第一缕月光', composer: 'Moonbeam', year: 2024, duration: '6:15', bpm: 54, wave: 'alpha', category: 'ambient', tags: ['月光', '安眠', '平和'], description: '专为入睡前设计的引导音乐，采用「渐弱节奏」（每分钟减少一次心跳频率），从 54 BPM 逐步降低至接近 40 BPM，配合低频脉冲辅助褪黑素分泌。', scenario: 'sleep' },
  { id: 'm016', title: '深度呼吸', composer: 'Breath Flow', year: 2023, duration: '5:00', bpm: 6, wave: 'alpha', category: 'meditation', tags: ['呼吸', '副交感', '焦虑缓解'], description: '这不是 BPM 为 6 的音乐，而是以 6 次/分钟的呼吸节奏为基准设计的引导音。每一次「吸气—呼气」周期都有对应的音色变化，帮助用户自然跟随呼吸节奏。', scenario: 'sleep' },
  { id: 'm017', title: '宇宙摇篮曲', composer: 'Cosmic Lullaby', year: 2022, duration: '8:30', bpm: 45, wave: 'alpha', category: 'ambient', tags: ['摇篮曲', '入睡', '无梦'], description: '以传统摇篮曲结构为基础，删除所有悲伤的小调元素，改为温暖的大调色彩。配合低频声波（40-50Hz）辅助大脑进入深度放松的 θ 波边界状态。', scenario: 'sleep' },
  { id: 'm018', title: '白噪音深海', composer: 'Deep Sleep', year: 2024, duration: '10:00', bpm: 0, wave: 'alpha', category: 'nature', tags: ['白噪音', '屏蔽', '入睡'], description: '纯净的粉红噪音（Pink Noise）而非白噪音——频谱更集中于低频，对睡眠的促进作用在随机对照试验中被证实优于白噪音。开放循环，随时可停止。', scenario: 'sleep' },
  { id: 'm019', title: '藏传颂钵', composer: 'Tibetan Bowl', year: 2023, duration: '7:00', bpm: 48, wave: 'alpha', category: 'meditation', tags: ['颂钵', '正念', '净化'], description: '录制于加德满都的颂钵演奏，叠加喜马拉雅盐灯的微弱光线音效（模拟）。颂钵的谐波泛音（ overtone harmonics ）能够引发大脑两侧半球的同步化，提升 α 波活动。', scenario: 'sleep' },
  { id: 'm020', title: '心灵复位', composer: 'Reset', year: 2024, duration: '4:50', bpm: 70, wave: 'alpha', category: 'ambient', tags: ['复位', '情绪调节', '快速'], description: '专为情绪危机后心理复位设计，约 5 分钟的结构化音乐体验：前 90 秒引导呼吸，中段 2 分钟情绪命名支持音乐，后 90 秒正向情绪锚定。', scenario: 'noon' },

  // ===== θ波（4-8Hz）— 深度放松与创意 =====
  { id: 'm021', title: '晨间冥想引导', composer: 'Mindful Studio', year: 2023, duration: '10:00', bpm: 0, wave: 'theta', category: 'meditation', tags: ['冥想', '觉察', '当下'], description: '轻柔的人声引导配合自然环境音，没有明确的节奏但有稳定的背景音支持。适合作为晨间冥想练习的音频伴侣。', scenario: 'morning' },
  { id: 'm022', title: '梦境漂流', composer: 'Dream Drift', year: 2022, duration: '12:00', bpm: 0, wave: 'theta', category: 'ambient', tags: ['梦境', '创意', '潜意识'], description: '开放式长时音乐，无歌词无明显节拍，以层叠的合成器音垫（Pad）营造漂浮感。适合午后小睡或进行无目标的白日梦，激发创造性思维。', scenario: 'noon' },
  { id: 'm023', title: '雨林深处', composer: 'Deep Rainforest', year: 2023, duration: '8:00', bpm: 0, wave: 'theta', category: 'nature', tags: ['雨林', '探险', '生命力'], description: '亚马逊雨林环境录音，包含远处瀑布声、稀有鸟类鸣叫与树叶摩擦声。丰富的低频层次能够自然引导 θ 波活动，适合需要心理能量补给时使用。', scenario: 'noon' },
  { id: 'm024', title: '心流之门', composer: 'Flow State', year: 2024, duration: '15:00', bpm: 0, wave: 'theta', category: 'ambient', tags: ['心流', '创意', '深度'], description: '专为进入心流状态设计的超长背景音，无节拍但有微妙的频率漂移，让大脑保持警觉但不紧张。适合艺术创作或复杂问题思考前的准备。', scenario: 'noon' },
  { id: 'm025', title: '记忆深处的光', composer: 'Inner Light', year: 2023, duration: '9:00', bpm: 0, wave: 'theta', category: 'ambient', tags: ['回忆', '自我探索', '内省'], description: '以即兴钢琴与电子音色融合的作品，灵感来自荣格「积极想象」技术。帮助大脑在清醒与梦境之间建立桥梁，适合情绪日记书写前的心理准备。', scenario: 'evening' },
  { id: 'm026', title: '瑜伽休息术', composer: 'Yoga Nidra', year: 2022, duration: '20:00', bpm: 0, wave: 'theta', category: 'meditation', tags: ['瑜伽', '深度放松', '恢复'], description: '瑜伽休息术（Yoga Nidra）专用背景音，以双耳节拍（Binaural Beats）技术嵌入 4Hz θ 波引导，配合极简的印度乐器（塔布拉鼓）点缀。', scenario: 'evening' },
  { id: 'm027', title: '月光冥想', composer: 'Moon Meditation', year: 2024, duration: '15:00', bpm: 0, wave: 'theta', category: 'meditation', tags: ['月光', '冥想', '宁静'], description: '无节拍冥想背景音，以古筝与电子延迟效果器结合，创造「水中月」的听觉意象。适合晚间情绪整理和压力释放。', scenario: 'sleep' },
  { id: 'm028', title: '睡眠仪式', composer: 'Sleep Ritual', year: 2023, duration: '25:00', bpm: 0, wave: 'theta', category: 'meditation', tags: ['入睡仪式', '习惯', '安眠'], description: '固定结构的入睡引导音乐：20 分钟内声音逐渐变小、节奏逐渐变慢，形成「入睡仪式感」。行为心理学研究显示，稳定的入睡前音乐习惯可显著改善睡眠质量。', scenario: 'sleep' },

  // ===== 场景组合包（按 晨/午/夜 分类）=====
  // 晨起包
  { id: 'm029', title: '破晓', composer: 'Sunrise Collection', year: 2025, duration: '5:00', bpm: 65, wave: 'alpha', category: 'ambient', tags: ['晨起', '希望', '新生', '组合'], description: '晨起专属组合曲目，以合成器模拟日出光线变化的声音色彩，配合 E 大调明亮旋律。帮助从睡眠状态自然过渡到清醒状态，减少「起床气」。', scenario: 'morning' },
  { id: 'm030', title: '第一口呼吸', composer: 'Morning Breath', year: 2024, duration: '4:00', bpm: 0, wave: 'alpha', category: 'meditation', tags: ['呼吸', '晨起', '觉察', '组合'], description: '专为刚睡醒的前 5 分钟设计的呼吸引导音乐，以稳定的背景频率支持 4-7-8 呼吸法。搭配闹钟使用，帮助身体从副交感主导的睡眠状态平稳切换。', scenario: 'morning' },
  { id: 'm031', title: '早安世界', composer: 'Good Morning World', year: 2023, duration: '3:30', bpm: 85, wave: 'alpha', category: 'ambient', tags: ['活力', '晨起', '积极', '组合'], description: '轻快的节拍配合温暖的吉他音色，为早晨注入正面情绪能量。曲目设计参考积极心理学中的「启动效应」——早晨听到的音乐情绪会影响一整天的心境基调。', scenario: 'morning' },

  // 午休包
  { id: 'm032', title: '小憩时光', composer: 'Power Nap', year: 2024, duration: '15:00', bpm: 0, wave: 'theta', category: 'meditation', tags: ['午休', '小憩', '恢复', '组合'], description: '15 分钟 Power Nap 专用引导音乐，包含前 5 分钟的放松引导、中间 5 分钟 θ 波背景支持，以及后 5 分钟的温和唤醒音。神经科学研究证实 15-20 分钟是小憩最佳时长。', scenario: 'noon' },
  { id: 'm033', title: '午后咖啡', composer: 'Afternoon Coffee', year: 2023, duration: '4:30', bpm: 90, wave: 'alpha', category: 'ambient', tags: ['午后', '咖啡馆', '轻松', '组合'], description: '低保真节拍配合咖啡研磨声采样，既有节奏感又不喧闹，帮助度过午后的「低谷期」。研究显示，适度的节奏刺激可以对抗午后皮质醇下降带来的困倦感。', scenario: 'noon' },
  { id: 'm034', title: '压力释放', composer: 'Stress Release', year: 2024, duration: '5:00', bpm: 70, wave: 'alpha', category: 'meditation', tags: ['减压', '焦虑', '呼吸', '组合'], description: '专为高压状态设计的 5 分钟音乐呼吸工具，以音乐引导同步呼气时长（比吸气长两倍），激活副交感神经系统。适合会议前、考试前等高压场景。', scenario: 'noon' },

  // 夜间包
  { id: 'm035', title: '日落冥想', composer: 'Sunset Meditation', year: 2023, duration: '10:00', bpm: 55, wave: 'alpha', category: 'meditation', tags: ['日落', '冥想', '告别', '组合'], description: '黄昏冥想引导，以印度传统里拉琴（Hurdy-gurdy）与自然音效交织。引导语帮助完成「今天」的认知关闭，减少夜间反刍思维。', scenario: 'evening' },
  { id: 'm036', title: '感恩时刻', composer: 'Gratitude Hour', year: 2024, duration: '6:00', bpm: 62, wave: 'alpha', category: 'ambient', tags: ['感恩', '积极情绪', '夜间', '组合'], description: '结合感恩心理学研究设计的晚间音乐，以温暖的中世纪调式（Mode）旋律为基础。配合感恩日记使用，可增强积极情绪的夜间维持效果。', scenario: 'evening' },
  { id: 'm037', title: '深度睡眠序列', composer: 'Deep Sleep Sequence', year: 2023, duration: '30:00', bpm: 0, wave: 'theta', category: 'meditation', tags: ['深度睡眠', '序列', '恢复', '组合'], description: '采用 「睡眠序列音乐」（Sleep Sequence Music）技术，整首曲目从 α 波引导频率开始，在 8 分钟处降至 θ 波频率，并持续 20 分钟，最后以极低频结束。', scenario: 'sleep' },
  { id: 'm038', title: '夜安心', composer: 'Safe at Night', year: 2024, duration: '8:00', bpm: 50, wave: 'alpha', category: 'ambient', tags: ['安全感', '入睡', '夜间', '组合'], description: '专为夜间焦虑设计的入睡音乐，以「安全基地」心理意象为灵感，通过音乐色彩塑造温暖、被包裹的听觉空间。适合有分离焦虑或夜间恐慌症状的用户。', scenario: 'sleep' },
  { id: 'm039', title: '梦乡之旅', composer: 'Dream Journey', year: 2022, duration: '12:00', bpm: 0, wave: 'theta', category: 'ambient', tags: ['做梦', '潜意识', '创意', '组合'], description: '以随机化的音乐序列生成「音乐迷宫」，没有固定路径，模拟清醒梦（Lucid Dreaming）的体验。适合对梦境探索感兴趣的用户在睡前聆听。', scenario: 'sleep' },
  { id: 'm040', title: '呼吸入睡法', composer: 'Breath to Sleep', year: 2024, duration: '5:00', bpm: 0, wave: 'alpha', category: 'meditation', tags: ['呼吸入睡', '4-7-8', '快速入睡', '组合'], description: '4-7-8 呼吸法的音乐版本：吸气 4 拍→屏息 7 拍→呼气 8 拍为一个周期，共 5 分钟约 10 个周期。配合递减的背景音量，帮助在 5 分钟内进入睡眠状态。', scenario: 'sleep' },

  // ===== 更多独立曲目（丰富内容池）=====
  { id: 'm041', title: '初雪', composer: 'Winter Studio', year: 2023, duration: '5:20', bpm: 58, wave: 'alpha', category: 'piano', tags: ['雪', '安静', '冬季', '纯净'], description: '钢琴独奏作品，旋律取自冬日初雪融化的声音意象，以降 A 大调呈现静谧之美。适合独处时刻和自我反思。', scenario: 'evening' },
  { id: 'm042', title: '竹影清风', composer: 'Bamboo Studio', year: 2024, duration: '4:45', bpm: 0, wave: 'alpha', category: 'nature', tags: ['竹林', '清风', '东方', '正念'], description: '竹林风声录制配合古琴泛音，呈现东方美学中的「空」与「静」。竹林风声频谱中含有丰富的 α 波同频成分，是最天然的放松音乐来源之一。', scenario: 'morning' },
  { id: 'm043', title: '萤火虫之夜', composer: 'Firefly Night', year: 2023, duration: '6:00', bpm: 56, wave: 'alpha', category: 'ambient', tags: ['萤火虫', '童年', '美好', '夏夜'], description: '夏夜草地环境音（含真实萤火虫季节录音）与温暖钢琴的融合，重现童年夏夜的美好记忆。根据普鲁斯特效应，美好的记忆音乐可激活海马体的积极情绪提取。', scenario: 'evening' },
  { id: 'm044', title: '高山牧场', composer: 'Alpine Meadow', year: 2022, duration: '7:30', bpm: 0, wave: 'alpha', category: 'nature', tags: ['高山', '牧场', '自由', '开阔'], description: '阿尔卑斯山高山牧场环境录音，配合远处牛铃声与微风声。研究表明，自然开阔空间的听觉体验可以显著降低杏仁核的活跃度，缓解焦虑症状。', scenario: 'morning' },
  { id: 'm045', title: '远方的钟声', composer: 'Distant Bells', year: 2024, duration: '5:00', bpm: 0, wave: 'alpha', category: 'ambient', tags: ['钟声', '冥想', '佛教', '内观'], description: '录制于斯里兰卡佛寺的晨钟暮鼓，以真实的钟声作为「时间标记」，帮助大脑建立规律的心理节律。适合有内观冥想习惯的用户。', scenario: 'morning' },
  { id: 'm046', title: '海风琴', composer: 'Aeolian Harp', year: 2023, duration: '6:45', bpm: 0, wave: 'alpha', category: 'ambient', tags: ['海风', '琴弦', '自然', '空灵'], description: '以「风鸣弦乐器」（Aeolian Harp）的自然泛音为核心——风吹过琴弦产生的自然旋律，是人类最早发现的「天然音乐」形式之一，代表着人与自然的和谐共鸣。', scenario: 'evening' },
  { id: 'm047', title: '心灵解码', composer: 'Mind Decode', year: 2024, duration: '8:00', bpm: 0, wave: 'theta', category: 'ambient', tags: ['自我探索', '潜意识', '心理学', '长时'], description: '专为心理治疗中的「自由联想」练习设计的背景音。结构开放，鼓励大脑在无意识层面自由游走，适合配合表达性写作或艺术创作使用。', scenario: 'noon' },
  { id: 'm048', title: '喜悦之源', composer: 'Joy Source', year: 2023, duration: '4:15', bpm: 100, wave: 'alpha', category: 'ambient', tags: ['喜悦', '活力', '多巴胺', '积极'], description: ' upbeat 的节奏配合明亮的合成器音色，激活奖励系统的音乐版本。根据音乐情绪理论，明快的节拍（90-120 BPM）和大调音阶可有效提升多巴胺分泌。', scenario: 'morning' },
  { id: 'm049', title: '接纳之歌', composer: 'Acceptance', year: 2024, duration: '7:00', bpm: 52, wave: 'alpha', category: 'ambient', tags: ['接纳', 'ACT', '情绪调节', '内省'], description: '以接纳承诺疗法（ACT）为灵感设计的音乐，不追求「消除」负面情绪，而是创造一个足够大的心理空间容纳所有情绪。适合正经历情绪困扰时的陪伴音乐。', scenario: 'evening' },
  { id: 'm050', title: '记忆修复', composer: 'Memory Repair', year: 2023, duration: '9:00', bpm: 0, wave: 'theta', category: 'meditation', tags: ['记忆', '海马体', '恢复', '神经'], description: '以神经科学文献为基础设计的音乐频率组合，参考 Hölzel 等人关于冥想对海马体影响的研究，配合特定频率的声音序列，旨在支持大脑记忆整合功能。', scenario: 'sleep' },

  // 补充曲目（丰富至 60 首）
  { id: 'm051', title: '松林晨雾', composer: 'Misty Pine', year: 2024, duration: '5:30', bpm: 0, wave: 'alpha', category: 'nature', tags: ['松林', '晨雾', '新生', '东方'], description: '清晨松林环境录音，配合古筝泛音。松针释放的植物精气（phytoncides）与负氧离子环境声共同作用，是日本「森林浴」的科学基础。', scenario: 'morning' },
  { id: 'm052', title: '晨间感恩', composer: 'Morning Gratitude', year: 2023, duration: '4:00', bpm: 68, wave: 'alpha', category: 'ambient', tags: ['感恩', '晨起', '积极', 'PERMA'], description: '以 PERMA 模型中的「积极情绪」为设计理念，温暖的钢琴旋律配合感恩主题的自然音效，帮助用户在早晨建立正向情绪基线。', scenario: 'morning' },
  { id: 'm053', title: '专注心流', composer: 'Deep Focus', year: 2024, duration: '30:00', bpm: 80, wave: 'alpha', category: 'ambient', tags: ['专注', '心流', '工作', '长时'], description: '超长专注背景音，30 分钟不重复结构。专为深度工作（Deep Work）设计，以稳定的低频脉冲维持警觉性，同时不干扰认知任务表现。', scenario: 'noon' },
  { id: 'm054', title: '解压音景', composer: 'Decompress', year: 2023, duration: '8:00', bpm: 0, wave: 'alpha', category: 'ambient', tags: ['解压', '皮质醇', '快速', '午间'], description: '专为办公室场景设计的 8 分钟解压音景，采用「声景疗法」（Soundscape Therapy）技术，融合多种自然元素的低频成分，帮助快速降低工作压力。', scenario: 'noon' },
  { id: 'm055', title: '原谅之光', composer: 'Forgiveness Light', year: 2024, duration: '6:30', bpm: 56, wave: 'alpha', category: 'ambient', tags: ['原谅', '宽恕', '释怀', '疗愈'], description: '为「原谅练习」设计的音乐引导，以温暖的中频弦乐为主调。根据 Enright 的原谅理论，配合适当的音乐可降低原谅练习的心理阻力。', scenario: 'evening' },
  { id: 'm056', title: '夜行者', composer: 'Night Walker', year: 2023, duration: '5:45', bpm: 72, wave: 'alpha', category: 'ambient', tags: ['夜间', '独处', '沉思', '城市'], description: '城市夜间氛围音（无歌词嘻哈节拍）与远处车流的混合，适合夜间独自外出或深夜归家时的心理陪伴。稳定的节拍提供安全感，城市的声响带来归属感。', scenario: 'evening' },
  { id: 'm057', title: '告别今天', composer: 'Goodbye Today', year: 2024, duration: '7:00', bpm: 50, wave: 'alpha', category: 'piano', tags: ['告别', '日终', '整理', '仪式'], description: '日终仪式音乐，以钢琴独奏呈现，帮助大脑完成「日终关闭」的心理程序。研究表明，完成固定仪式有助于减少夜间反刍思维，改善睡眠质量。', scenario: 'evening' },
  { id: 'm058', title: '无梦安眠', composer: 'Dreamless Sleep', year: 2023, duration: '20:00', bpm: 0, wave: 'delta', category: 'nature', tags: ['深度睡眠', 'Delta波', '无梦', '恢复'], description: '嵌入 Delta 波（0.5-3Hz）引导频率的背景音，比 θ 波更深的放松状态，专为需要深度睡眠恢复的日子设计。如持续聆听超过 30 分钟，建议使用舒适音量。', scenario: 'sleep' },
  { id: 'm059', title: '婴儿般的睡眠', composer: 'Baby Sleep', year: 2024, duration: '12:00', bpm: 0, wave: 'alpha', category: 'ambient', tags: ['安心', '安全感', '无威胁', '睡眠'], description: '以子宫内声音环境为灵感——稳定的低频声（类似血液流动声）混合母亲心跳节律。研究表明，这种声音环境与胎儿期听觉记忆共鸣，可触发最深层的心理安全感。', scenario: 'sleep' },
  { id: 'm060', title: '喜悦冥想', composer: 'Joy Meditation', year: 2023, duration: '11:00', bpm: 0, wave: 'alpha', category: 'meditation', tags: ['喜悦', '慈心禅', '慈悲', '积极'], description: '基于慈心禅（Loving-Kindness Meditation）设计的音乐引导，以温暖的人声配合大提琴低沉的共鸣，帮助培养对自己和他人的善意，是对抗抑郁的有效补充手段。', scenario: 'morning' },
];

/**
 * 根据场景获取推荐音乐
 * @param {string} scenario - morning | noon | evening | sleep
 * @param {number} count - 返回数量
 * @returns {Array} 随机选择的音乐列表
 */
function getMusicByScenario(scenario, count = 3) {
  const filtered = MUSIC.filter(m => m.scenario === scenario);
  // 打乱顺序后取前 count 首
  return filtered.sort(() => Math.random() - 0.5).slice(0, count);
}

/**
 * 获取适合特定情绪的音乐
 * @param {string} emotionKey - joy | sadness | anger | fear | anxiety | calm
 * @param {number} count
 * @returns {Array}
 */
function getMusicByEmotion(emotionKey, count = 3) {
  const emotionMap = {
    joy: ['α波', '活力', '积极'],
    sadness: ['温暖', '接纳', '支持'],
    anger: ['平静', '呼吸', '减压'],
    fear: ['安全', '保护', '深呼吸'],
    anxiety: ['呼吸', '安全感', '减压'],
    calm: ['自然', '正念', '当下'],
  };
  const keywords = emotionMap[emotionKey] || ['放松'];
  const filtered = MUSIC.filter(m =>
    m.tags.some(tag => keywords.some(k => tag.includes(k)))
  );
  return filtered.sort(() => Math.random() - 0.5).slice(0, count);
}

/**
 * 获取所有音乐（支持按分类过滤）
 * @param {Object} filters - { category, wave, scenario }
 * @returns {Array}
 */
function getAllMusic(filters = {}) {
  let result = [...MUSIC];
  if (filters.category) result = result.filter(m => m.category === filters.category);
  if (filters.wave) result = result.filter(m => m.wave === filters.wave);
  if (filters.scenario) result = result.filter(m => m.scenario === filters.scenario);
  return result;
}
