// DEBUG: Run this in the browser console to see what voice system sees

console.log('=== VOICE DATA DEBUG ===');
console.log('scaffSystems length:', scaffSystems?.length || 'UNDEFINED');
console.log('scaffSystems:', scaffSystems);
console.log('First 5 systems:', scaffSystems?.slice(0, 5).map(s => ({
    id: s.id,
    pNumber: s.pNumber,
    hireStatus: s.hireStatus,
    siteContact: s.siteContact
})));

console.log('\nVoice Dashboard Bridge:', voiceDashboardBridge);
console.log('Conversation State:', voiceDashboardBridge?.conversationState);

console.log('\nTrying to find P9:');
const p9 = scaffSystems?.find(s => s.pNumber?.toUpperCase() === 'P9');
console.log('P9 found:', p9);

console.log('\nAll P numbers:');
console.log(scaffSystems?.map(s => s.pNumber).join(', '));
