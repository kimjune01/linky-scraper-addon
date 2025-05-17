import { describe, it, expect } from 'vitest';
// Import isContentLoading from sampleFunction.ts
import { isContentLoading } from './isContentLoading';

describe('isContentLoading', () => {
  it('returns true for empty content', () => {
    expect(isContentLoading('', 'https://dummy.url').result).toBe(true);
    expect(isContentLoading('   ', 'https://dummy.url').result).toBe(true);
  });

  it('returns true for loading indicators', () => {
    expect(isContentLoading('loading', 'https://dummy.url').result).toBe(true);
    expect(isContentLoading('Loading', 'https://dummy.url').result).toBe(true);
    expect(isContentLoading('please wait', 'https://dummy.url').result).toBe(true);
    expect(isContentLoading('로딩', 'https://dummy.url').result).toBe(true);
    expect(isContentLoading('spinner', 'https://dummy.url').result).toBe(true);
    expect(isContentLoading('skeleton', 'https://dummy.url').result).toBe(true);
    expect(isContentLoading('placeholder', 'https://dummy.url').result).toBe(true);
  });

  it('returns true for YouTube/streaming UI text', () => {
    expect(isContentLoading('Tap to unmute', 'https://www.youtube.com/watch?v=Fs53QhJM9FA').result).toBe(true);
    expect(
      isContentLoading("If playback doesn't begin shortly, try restarting your device.", 'https://dummy.url').result,
    ).toBe(true);
    expect(
      isContentLoading(
        'An error occurred while retrieving sharing information. Please try again later.',
        'https://dummy.url',
      ).result,
    ).toBe(true);
    expect(isContentLoading('NaN / NaN', 'https://dummy.url').result).toBe(true);
    expect(isContentLoading("You're signed out", 'https://dummy.url').result).toBe(true);
    expect(
      isContentLoading(
        "Videos that you watch may be added to the TV's watch history and influence TV recommendations.",
        'https://dummy.url',
      ).result,
    ).toBe(true);
  });

  it('returns true for image-only or UI-noise content', () => {
    expect(isContentLoading('![Video](blob:https://www.youtube.com/abc123)', 'https://dummy.url').result).toBe(true);
    expect(isContentLoading('#', 'https://dummy.url').result).toBe(true);
    expect(isContentLoading('###', 'https://dummy.url').result).toBe(true);
    expect(isContentLoading('---', 'https://dummy.url').result).toBe(true);
    expect(isContentLoading('NaN', 'https://dummy.url').result).toBe(true);
    expect(isContentLoading('1 / 1', 'https://dummy.url').result).toBe(true);
    expect(isContentLoading('2', 'https://dummy.url').result).toBe(true);
  });

  it('returns true for content with only UI lines', () => {
    const content = `Tap to unmute\nIf playback doesn't begin shortly, try restarting your device.`;
    expect(isContentLoading(content, 'https://dummy.url').result).toBe(true);
  });

  it('returns false for meaningful content', () => {
    expect(isContentLoading('This is a real article about science.', 'https://dummy.url').result).toBe(false);
    expect(isContentLoading('Hello world!\nThis is a test.', 'https://dummy.url').result).toBe(false);
    expect(isContentLoading('The quick brown fox jumps over the lazy dog.', 'https://dummy.url').result).toBe(false);
  });

  it('returns true for content with only short generic lines', () => {
    expect(isContentLoading('Hi\nOk', 'https://dummy.url').result).toBe(true);
    expect(isContentLoading('Yes\nNo', 'https://dummy.url').result).toBe(true);
  });

  it('returns false for real YouTube video content', () => {
    const youtubeContent = `# \n•\n\n### \nNaN / NaN Back CA Skip navigation Search  with your voice Create Notifications Avatar image CA\n!Video\nTap to unmute 2x If playback doesn't begin shortly, try restarting your device. • Up next LiveUpcoming Cancel Play now we still don't know how or when our ancestors ended up in certain places. You're signed out Videos that you watch may be added to the TV's watch history and influence TV recommendations. To avoid this, cancel and sign in to YouTube on your computer. Cancel Confirm SciShow Subscribe Subscribed Share Include playlist An error occurred while retrieving sharing information. Please try again later.\n\n# When Did Humans ACTUALLY Get to the Americas?\nSciShow\nVerified 8.19M subscribers Join <__slot-el> Subscribe <__slot-el> Subscribed 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9. 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 K Share 47,862 views 8 hours ago #SciShow #science #education 47,862 views • 15 May 2025 • #SciShow #science #education Show less Improve your career using our code "SCISHOW" for 30% off on all TripleTen's programs! Sign up for a FREE TripleTen career consultation with the link: https://get.tripleten.com/scishow … ...more  Transcript Follow along using the transcript.\nShow transcript SciShow\n8.19M subscribers Videos About Videos About Support us on Patreon! Twitter TikTok Instagram SciShow Space SciShow Tangents SciShow Kids Facebook Show less #SciShow #science #education\n\n# When Did Humans ACTUALLY Get to the Americas?\n47,862 views 15 May 2025 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9. 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 K Share Download  Thanks Clip Save Shop the SciShow store Moon Rock Protection Squad T-Shirt L\nCA$44.68\n+\ntaxes and fees\nComplexly Store\nThis specific SciShow shirt is inspired by our most recent Deep Dive episode, all about a moon rock heist. Protection starts with caring, and you can show that you care by joining the Moon Rock Protection Squad!\nShop\nComplexly Store Tangents Poetry Collection\nCA$16.76\n+\ntaxes and fees\nComplexly Store\nWe are excited to announce that—at long last—we're publishing an ebook of over 200 of our Traditional Science Poems as a special memento to remember the show by. All of our parody song lyrics, horrible slant rhymes, and basically-children's-books will live on in this collection of not-all-safe-for-work poetry! *Warning*\nContains adult language This collection also contains 25 original illustrations from artist Josh Quick!\nShop\nComplexly Store Wandering Womb Pin\nCA$18.16\n+\ntaxes and fees\nComplexly Store\nThis pin playfully illustrates the strange, and thankfully outdated, historical concept of hysteria. For centuries, unexplained health issues in women were attributed to a "wandering uterus." Doctors believed the uterus could move freely within the body, causing various symptoms. Thankfully, modern medicine has debunked this idea. Originally released in 2018, this pin quickly became a fan favorite, selling out almost immediately. We're excited to bring it back for those who missed out the first time. This hard enamel pin is about 1.25 inches wide and 3/4 of an inch tall and features double clasps so it doesn't go wandering. DETAILS Hard enamel pin Dimensions: 1.25 inches by 0.75 inches (3.175cm x 1.9cm) A SciShow classic pin inspired by this episode\nShop\nComplexly Store SciShow Keychain\nCA$13.97\n+\ntaxes and fees\nComplexly Store\nShop\nComplexly Store Orca Bucket Hat\nCA$44.68\n+\ntaxes and fees\nComplexly Store\nIn much the same way as Orcas are teaching each other to attack sailboats off the coast of Spain, there was recently a pod of whales that liked to swim around with dead salmon on their head. Learn more about their mysterious behavior, and buy our bucket-hat here! One size fits most!\nShop\nComplexly Store 2025 Complexly Calendar\nCA$6.99\n+\ntaxes and fees\nComplexly Store\nThis year's calendar celebrates a quarter century of progress, and it is a collaboration between all of your favorite Complexly YouTube channels! Available now!\nShop\nComplexly Store\n\n## Comments 391\nTop comments\nNewest first\n\n## In this video\nTranscript\n\n## Products\nSciShow tagged products below. Learn more Moon Rock Protection Squad T-Shirt LComplexly StoreCA$44.68\nView Tangents Poetry CollectionComplexly StoreCA$16.76\nView Wandering Womb PinComplexly StoreCA$18.16\nView SciShow KeychainComplexly StoreCA$13.97\nView Orca Bucket HatComplexly StoreCA$44.68\nView 2025 Complexly CalendarComplexly StoreCA$6.99\nView SciShow Cork Pin BoardComplexly StoreCA$32.12\nView Space Donut MugComplexly StoreCA$26.53\nView SciShow Gradient DecalComplexly StoreCA$8.38\nView SciShow Rocks Box April Fools Sticker SetComplexly StoreCA$30.72\n\n## Create clip\nJune Kim Public Add a title (required) 0/140 – 30.0 seconds Cancel Share clip Continue clipping after ad finishes Can't create clip while ad is playing\n\n## Description\nWhen Did Humans ACTUALLY Get to the Americas? 3.6K Likes 47,862 Views 8h Ago Improve your career using our code "SCISHOW" for 30% off on all TripleTen's programs! Sign up for a FREE TripleTen career consultation with the link: https://get.tripleten.com/scishow There are a lot of great debates in science, and a major one is when exactly humans reached the Americas. There's contentious footprints and wishy-washy stone tools, all of which has spurred some heated academic arguments. But the most controversial evidence called the Cerutti Mastodon suggests that, if it's real, humans may not have even been the first hominin species on our continent. \nHosted by: Savannah Geary (they/them)\nSupport us for $8/month on Patreon and keep SciShow going! / scishow Or support us directly: https://complexly.com/support Join our SciShow email list to get the latest news and highlights: https://mailchi.mp/scishow/email ----------\nHuge thanks go to the following Patreon supporters for helping us keep SciShow free for everyone forever: J.V. Rosenbalm, Bethany Matthews, Toyas Dhake, David Johnston, Lyndsay Brown, Alan Wong, Jeffrey Mckishen, Kaitlyn O'Callaghan, Reed Spilmann, Garrett Galloway, Friso, kickinwasabi, Gizmo, Jeremy Mattern, Blood Doctor Kelly, Eric Jensen, Jaap Westera, Matt Curls, Jp Lynch, Wesus, Chris Curry, Cye Stoner, Kevin Knupp, Piya Shedden, Adam Brainard, Alex Hackman, Jason A Saslow, Kevin Bealer, Joseph Ruf, Chris Peters, Chris Mackey, Steve Gums\nLooking for SciShow elsewhere on the internet?\nSciShow Tangents Podcast: https://scishow-tangents.simplecast.com/ TikTok: / thescishow Instagram: / thescishow Facebook: / scishow Bluesky: https://bsky.app/profile/scishow.bsky... #SciShow #science #education #learning #complexly ----------\nSources: https://docs.google.com/document/d/e/... … ...more  Show less Transcript Follow along using the transcript.\nShow transcript SciShow\n8.19M subscribers Videos About Videos About Support us on Patreon! Twitter TikTok Instagram SciShow Space SciShow Tangents SciShow Kids Facebook\n\n## Transcript\n\n### \nNaN / NaN`;
    const result = isContentLoading(youtubeContent, 'https://www.youtube.com/watch?v=Fs53QhJM9FA');
    console.log('YouTube meaningfulLines:', result.meaningfulLines);
    expect(result.result).toBe(false);
  });
});
