/**
 * Curated KJV Bible verses mapped to emotional states.
 * Each mood maps to an array of { text, reference } objects.
 */

const verses = {
  Happy: [
    { text: "This is the day which the LORD hath made; we will rejoice and be glad in it.", reference: "Psalm 118:24" },
    { text: "A merry heart doeth good like a medicine: but a broken spirit drieth the bones.", reference: "Proverbs 17:22" },
    { text: "Rejoice in the Lord alway: and again I say, Rejoice.", reference: "Philippians 4:4" },
    { text: "Thou wilt shew me the path of life: in thy presence is fulness of joy; at thy right hand there are pleasures for evermore.", reference: "Psalm 16:11" },
    { text: "Delight thyself also in the LORD; and he shall give thee the desires of thine heart.", reference: "Psalm 37:4" },
    { text: "The joy of the LORD is your strength.", reference: "Nehemiah 8:10" },
  ],
  Grateful: [
    { text: "In every thing give thanks: for this is the will of God in Christ Jesus concerning you.", reference: "1 Thessalonians 5:18" },
    { text: "O give thanks unto the LORD; for he is good: for his mercy endureth for ever.", reference: "Psalm 136:1" },
    { text: "Enter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name.", reference: "Psalm 100:4" },
    { text: "Every good gift and every perfect gift is from above, and cometh down from the Father of lights.", reference: "James 1:17" },
    { text: "Giving thanks always for all things unto God and the Father in the name of our Lord Jesus Christ.", reference: "Ephesians 5:20" },
    { text: "I will praise the name of God with a song, and will magnify him with thanksgiving.", reference: "Psalm 69:30" },
  ],
  Peaceful: [
    { text: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.", reference: "John 14:27" },
    { text: "Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.", reference: "Isaiah 26:3" },
    { text: "And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.", reference: "Philippians 4:7" },
    { text: "The LORD will give strength unto his people; the LORD will bless his people with peace.", reference: "Psalm 29:11" },
    { text: "Be still, and know that I am God.", reference: "Psalm 46:10" },
    { text: "Great peace have they which love thy law: and nothing shall offend them.", reference: "Psalm 119:165" },
  ],
  Hopeful: [
    { text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.", reference: "Jeremiah 29:11" },
    { text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles.", reference: "Isaiah 40:31" },
    { text: "Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.", reference: "Romans 15:13" },
    { text: "For we are saved by hope: but hope that is seen is not hope: for what a man seeth, why doth he yet hope for?", reference: "Romans 8:24" },
    { text: "Which hope we have as an anchor of the soul, both sure and stedfast.", reference: "Hebrews 6:19" },
    { text: "Be of good courage, and he shall strengthen your heart, all ye that hope in the LORD.", reference: "Psalm 31:24" },
  ],
  Joyful: [
    { text: "These things have I spoken unto you, that my joy might remain in you, and that your joy might be full.", reference: "John 15:11" },
    { text: "Thou hast put gladness in my heart, more than in the time that their corn and their wine increased.", reference: "Psalm 4:7" },
    { text: "For ye shall go out with joy, and be led forth with peace.", reference: "Isaiah 55:12" },
    { text: "Weeping may endure for a night, but joy cometh in the morning.", reference: "Psalm 30:5" },
    { text: "And my soul shall be joyful in the LORD: it shall rejoice in his salvation.", reference: "Psalm 35:9" },
    { text: "With joy shall ye draw water out of the wells of salvation.", reference: "Isaiah 12:3" },
  ],
  Content: [
    { text: "Not that I speak in respect of want: for I have learned, in whatsoever state I am, therewith to be content.", reference: "Philippians 4:11" },
    { text: "But godliness with contentment is great gain.", reference: "1 Timothy 6:6" },
    { text: "Let your conversation be without covetousness; and be content with such things as ye have.", reference: "Hebrews 13:5" },
    { text: "The LORD is my shepherd; I shall not want.", reference: "Psalm 23:1" },
    { text: "I will be satisfied, when I awake, with thy likeness.", reference: "Psalm 17:15" },
    { text: "Rest in the LORD, and wait patiently for him.", reference: "Psalm 37:7" },
  ],
  Anxious: [
    { text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.", reference: "Philippians 4:6" },
    { text: "Cast thy burden upon the LORD, and he shall sustain thee: he shall never suffer the righteous to be moved.", reference: "Psalm 55:22" },
    { text: "When I am afraid, I will trust in thee.", reference: "Psalm 56:3" },
    { text: "Casting all your care upon him; for he careth for you.", reference: "1 Peter 5:7" },
    { text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God.", reference: "Isaiah 41:10" },
    { text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.", reference: "Matthew 11:28" },
  ],
  Sad: [
    { text: "The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.", reference: "Psalm 34:18" },
    { text: "He healeth the broken in heart, and bindeth up their wounds.", reference: "Psalm 147:3" },
    { text: "Blessed are they that mourn: for they shall be comforted.", reference: "Matthew 5:4" },
    { text: "For his anger endureth but a moment; in his favour is life: weeping may endure for a night, but joy cometh in the morning.", reference: "Psalm 30:5" },
    { text: "The LORD is my light and my salvation; whom shall I fear?", reference: "Psalm 27:1" },
    { text: "He hath sent me to bind up the brokenhearted.", reference: "Isaiah 61:1" },
  ],
  Angry: [
    { text: "Be ye angry, and sin not: let not the sun go down upon your wrath.", reference: "Ephesians 4:26" },
    { text: "A soft answer turneth away wrath: but grievous words stir up anger.", reference: "Proverbs 15:1" },
    { text: "He that is slow to anger is better than the mighty.", reference: "Proverbs 16:32" },
    { text: "Cease from anger, and forsake wrath: fret not thyself in any wise to do evil.", reference: "Psalm 37:8" },
    { text: "Wherefore, my beloved brethren, let every man be swift to hear, slow to speak, slow to wrath.", reference: "James 1:19" },
    { text: "Be not overcome of evil, but overcome evil with good.", reference: "Romans 12:21" },
  ],
  Lonely: [
    { text: "I will never leave thee, nor forsake thee.", reference: "Hebrews 13:5" },
    { text: "When my father and my mother forsake me, then the LORD will take me up.", reference: "Psalm 27:10" },
    { text: "Lo, I am with you alway, even unto the end of the world.", reference: "Matthew 28:20" },
    { text: "God setteth the solitary in families.", reference: "Psalm 68:6" },
    { text: "Fear not: for I have redeemed thee, I have called thee by thy name; thou art mine.", reference: "Isaiah 43:1" },
    { text: "The LORD thy God in the midst of thee is mighty; he will save, he will rejoice over thee with joy.", reference: "Zephaniah 3:17" },
  ],
  Fearful: [
    { text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.", reference: "2 Timothy 1:7" },
    { text: "The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?", reference: "Psalm 27:1" },
    { text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God.", reference: "Isaiah 41:10" },
    { text: "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me.", reference: "Psalm 23:4" },
    { text: "What time I am afraid, I will trust in thee.", reference: "Psalm 56:3" },
    { text: "There is no fear in love; but perfect love casteth out fear.", reference: "1 John 4:18" },
  ],
  Overwhelmed: [
    { text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.", reference: "Matthew 11:28" },
    { text: "My grace is sufficient for thee: for my strength is made perfect in weakness.", reference: "2 Corinthians 12:9" },
    { text: "I can do all things through Christ which strengtheneth me.", reference: "Philippians 4:13" },
    { text: "From the end of the earth will I cry unto thee, when my heart is overwhelmed: lead me to the rock that is higher than I.", reference: "Psalm 61:2" },
    { text: "Cast thy burden upon the LORD, and he shall sustain thee.", reference: "Psalm 55:22" },
    { text: "God is our refuge and strength, a very present help in trouble.", reference: "Psalm 46:1" },
  ],
  Confused: [
    { text: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.", reference: "James 1:5" },
    { text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.", reference: "Proverbs 3:5" },
    { text: "For God is not the author of confusion, but of peace.", reference: "1 Corinthians 14:33" },
    { text: "Thy word is a lamp unto my feet, and a light unto my path.", reference: "Psalm 119:105" },
    { text: "In all thy ways acknowledge him, and he shall direct thy paths.", reference: "Proverbs 3:6" },
    { text: "The entrance of thy words giveth light; it giveth understanding unto the simple.", reference: "Psalm 119:130" },
  ],
  Frustrated: [
    { text: "And let us not be weary in well doing: for in due season we shall reap, if we faint not.", reference: "Galatians 6:9" },
    { text: "Wait on the LORD: be of good courage, and he shall strengthen thine heart.", reference: "Psalm 27:14" },
    { text: "But they that wait upon the LORD shall renew their strength.", reference: "Isaiah 40:31" },
    { text: "For I reckon that the sufferings of this present time are not worthy to be compared with the glory which shall be revealed in us.", reference: "Romans 8:18" },
    { text: "He giveth power to the faint; and to them that have no might he increaseth strength.", reference: "Isaiah 40:29" },
    { text: "Be still, and know that I am God.", reference: "Psalm 46:10" },
  ],
  Guilty: [
    { text: "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.", reference: "1 John 1:9" },
    { text: "There is therefore now no condemnation to them which are in Christ Jesus.", reference: "Romans 8:1" },
    { text: "As far as the east is from the west, so far hath he removed our transgressions from us.", reference: "Psalm 103:12" },
    { text: "Come now, and let us reason together, saith the LORD: though your sins be as scarlet, they shall be as white as snow.", reference: "Isaiah 1:18" },
    { text: "Who is a God like unto thee, that pardoneth iniquity?", reference: "Micah 7:18" },
    { text: "Blessed is he whose transgression is forgiven, whose sin is covered.", reference: "Psalm 32:1" },
  ],
  Ashamed: [
    { text: "Fear not; for thou shalt not be ashamed: neither be thou confounded.", reference: "Isaiah 54:4" },
    { text: "There is therefore now no condemnation to them which are in Christ Jesus.", reference: "Romans 8:1" },
    { text: "For the scripture saith, Whosoever believeth on him shall not be ashamed.", reference: "Romans 10:11" },
    { text: "I sought the LORD, and he heard me, and delivered me from all my fears.", reference: "Psalm 34:4" },
    { text: "Behold, I lay in Zion a chief corner stone, elect, precious: and he that believeth on him shall not be confounded.", reference: "1 Peter 2:6" },
    { text: "The Lord GOD will help me; therefore shall I not be confounded.", reference: "Isaiah 50:7" },
  ],
  Jealous: [
    { text: "Let us not be desirous of vain glory, provoking one another, envying one another.", reference: "Galatians 5:26" },
    { text: "A sound heart is the life of the flesh: but envy the rottenness of the bones.", reference: "Proverbs 14:30" },
    { text: "Charity envieth not; charity vaunteth not itself, is not puffed up.", reference: "1 Corinthians 13:4" },
    { text: "Delight thyself also in the LORD; and he shall give thee the desires of thine heart.", reference: "Psalm 37:4" },
    { text: "But godliness with contentment is great gain.", reference: "1 Timothy 6:6" },
    { text: "Set your affection on things above, not on things on the earth.", reference: "Colossians 3:2" },
  ],
  Grief: [
    { text: "Blessed are they that mourn: for they shall be comforted.", reference: "Matthew 5:4" },
    { text: "The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.", reference: "Psalm 34:18" },
    { text: "He healeth the broken in heart, and bindeth up their wounds.", reference: "Psalm 147:3" },
    { text: "And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying.", reference: "Revelation 21:4" },
    { text: "For I am persuaded, that neither death, nor life...shall be able to separate us from the love of God.", reference: "Romans 8:38-39" },
    { text: "To every thing there is a season, and a time to every purpose under the heaven.", reference: "Ecclesiastes 3:1" },
  ],
  Stressed: [
    { text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.", reference: "Matthew 11:28" },
    { text: "Casting all your care upon him; for he careth for you.", reference: "1 Peter 5:7" },
    { text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.", reference: "Philippians 4:6" },
    { text: "The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters.", reference: "Psalm 23:1-2" },
    { text: "My grace is sufficient for thee: for my strength is made perfect in weakness.", reference: "2 Corinthians 12:9" },
    { text: "Be still, and know that I am God.", reference: "Psalm 46:10" },
  ],
  Tired: [
    { text: "He giveth power to the faint; and to them that have no might he increaseth strength.", reference: "Isaiah 40:29" },
    { text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.", reference: "Matthew 11:28" },
    { text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary.", reference: "Isaiah 40:31" },
    { text: "It is vain for you to rise up early, to sit up late...for so he giveth his beloved sleep.", reference: "Psalm 127:2" },
    { text: "My soul, wait thou only upon God; for my expectation is from him.", reference: "Psalm 62:5" },
    { text: "And let us not be weary in well doing: for in due season we shall reap, if we faint not.", reference: "Galatians 6:9" },
  ],
  Discouraged: [
    { text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee.", reference: "Joshua 1:9" },
    { text: "Wait on the LORD: be of good courage, and he shall strengthen thine heart.", reference: "Psalm 27:14" },
    { text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee.", reference: "Isaiah 41:10" },
    { text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil.", reference: "Jeremiah 29:11" },
    { text: "The LORD is good, a strong hold in the day of trouble; and he knoweth them that trust in him.", reference: "Nahum 1:7" },
    { text: "And let us not be weary in well doing: for in due season we shall reap, if we faint not.", reference: "Galatians 6:9" },
  ],
  Worried: [
    { text: "Therefore I say unto you, Take no thought for your life, what ye shall eat, or what ye shall drink.", reference: "Matthew 6:25" },
    { text: "Casting all your care upon him; for he careth for you.", reference: "1 Peter 5:7" },
    { text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.", reference: "Philippians 4:6" },
    { text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.", reference: "Proverbs 3:5" },
    { text: "The LORD is my shepherd; I shall not want.", reference: "Psalm 23:1" },
    { text: "When I am afraid, I will trust in thee.", reference: "Psalm 56:3" },
  ],
  Depressed: [
    { text: "Why art thou cast down, O my soul? and why art thou disquieted within me? hope thou in God.", reference: "Psalm 42:11" },
    { text: "The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.", reference: "Psalm 34:18" },
    { text: "I waited patiently for the LORD; and he inclined unto me, and heard my cry. He brought me up also out of an horrible pit.", reference: "Psalm 40:1-2" },
    { text: "For his anger endureth but a moment; in his favour is life: weeping may endure for a night, but joy cometh in the morning.", reference: "Psalm 30:5" },
    { text: "He healeth the broken in heart, and bindeth up their wounds.", reference: "Psalm 147:3" },
    { text: "The righteous cry, and the LORD heareth, and delivereth them out of all their troubles.", reference: "Psalm 34:17" },
  ],
  Restless: [
    { text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.", reference: "Matthew 11:28" },
    { text: "Be still, and know that I am God.", reference: "Psalm 46:10" },
    { text: "Thou wilt keep him in perfect peace, whose mind is stayed on thee.", reference: "Isaiah 26:3" },
    { text: "Rest in the LORD, and wait patiently for him.", reference: "Psalm 37:7" },
    { text: "My soul, wait thou only upon God; for my expectation is from him.", reference: "Psalm 62:5" },
    { text: "Return unto thy rest, O my soul; for the LORD hath dealt bountifully with thee.", reference: "Psalm 116:7" },
  ],
};

/**
 * Return 3 random unique verses for a given mood.
 * @param {string} mood - one of the MOODS enum values
 * @returns {{ text: string, reference: string }[]}
 */
function getVersesForMood(mood) {
  const pool = verses[mood];
  if (!pool || pool.length === 0) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

module.exports = { getVersesForMood, MOOD_KEYS: Object.keys(verses) };
