import { jest } from '@jest/globals';

// Mock node-fetch
const mockFetch = jest.fn();
jest.mock('node-fetch', () => ({
  __esModule: true,
  default: mockFetch,
}));

// Mock xml2js
const mockParseStringPromise = jest.fn();
jest.mock('xml2js', () => ({
  Parser: jest.fn().mockImplementation(() => ({
    parseStringPromise: mockParseStringPromise,
  })),
}));

// Import the functions to be tested
import {
  fetch_pubmed_details,
  fetchPubmedDetailsDeclaration,
} from '../../tools/fetchPubmedDetails.js';

// Store original process.env
const originalEnv = { ...process.env };

describe('fetchPubmedDetails Tool', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockParseStringPromise.mockClear();
    process.env = { ...originalEnv };
    delete process.env.NCBI_API_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const samplePmid = '1234567';
  const mockValidXmlResponse = (pmid, pmcId = null) => {
    let articleIds = [{ $: { IdType: 'pubmed' }, _: pmid }];
    if (pmcId) {
      articleIds.push({ $: { IdType: 'pmc' }, _: pmcId });
    }

    return {
      PubmedArticleSet: {
        PubmedArticle: {
          MedlineCitation: {
            Article: {
              ArticleTitle: `Title for ${pmid}`,
              Abstract: {
                AbstractText: `Abstract for ${pmid}. This is a test abstract.`,
              },
              AuthorList: {
                Author: [
                  { LastName: 'Doe', Initials: 'J' },
                  { LastName: 'Smith', Initials: 'A' },
                ],
              },
              Journal: {
                Title: 'Journal of Test Studies',
                JournalIssue: {
                  PubDate: { Year: '2023' },
                },
              },
            },
          },
          PubmedData: {
            ArticleIdList: {
              ArticleId: articleIds,
            },
          },
        },
      },
    };
  };

  describe('fetch_pubmed_details function', () => {
    it('should return error for invalid PMID format', async () => {
      const invalidPmids = ['ABC', '123A', null, undefined, ''];
      for (const pmid of invalidPmids) {
        const response = await fetch_pubmed_details({ pmid });
        expect(response.result.success).toBe(false);
        expect(response.result.error).toContain('Invalid PMID format');
        expect(mockFetch).not.toHaveBeenCalled();
      }
    });

    it('should make a successful EFetch call and parse XML (no PMC ID)', async () => {
      const xmlText = '<xml>data</xml>'; // Dummy XML text
      mockFetch.mockResolvedValueOnce({ ok: true, text: async () => xmlText });
      mockParseStringPromise.mockResolvedValueOnce(mockValidXmlResponse(samplePmid));

      const response = await fetch_pubmed_details({ pmid: samplePmid });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchCall = mockFetch.mock.calls[0][0];
      expect(fetchCall).toContain('efetch.fcgi');
      expect(fetchCall).toContain(`id=${samplePmid}`);
      expect(fetchCall).toContain('retmode=xml');
      expect(mockParseStringPromise).toHaveBeenCalledWith(xmlText);

      expect(response.result.success).toBe(true);
      expect(response.result.pmid).toBe(samplePmid);
      expect(response.result.title).toBe(`Title for ${samplePmid}`);
      expect(response.result.abstract).toBe(`Abstract for ${samplePmid}. This is a test abstract.`);
      expect(response.result.url).toBe(`https://pubmed.ncbi.nlm.nih.gov/${samplePmid}/`);
      expect(response.result.pmc_url).toBeNull();
      expect(response.result.full_text_status).toContain(
        'Full text might be available via publisher link'
      );
      expect(response.result.authors).toEqual(['Doe J', 'Smith A']);
      expect(response.result.journal).toBe('Journal of Test Studies');
      expect(response.result.publication_date).toBe('2023');
    });

    it('should successfully fetch and include PMC URL if PMC ID is present', async () => {
      const pmcId = 'PMC12345';
      mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '<pmc_xml />' });
      mockParseStringPromise.mockResolvedValueOnce(mockValidXmlResponse(samplePmid, pmcId));

      const response = await fetch_pubmed_details({ pmid: samplePmid });

      expect(response.result.success).toBe(true);
      expect(response.result.pmc_url).toBe(`https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcId}/`);
      expect(response.result.full_text_status).toContain('Full text likely available via PMC link');
    });

    it('should include NCBI_API_KEY if available', async () => {
      process.env.NCBI_API_KEY = 'test-ncbi-key';
      mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '<xml />' });
      mockParseStringPromise.mockResolvedValueOnce(mockValidXmlResponse(samplePmid));

      await fetch_pubmed_details({ pmid: samplePmid });
      expect(mockFetch.mock.calls[0][0]).toContain('api_key=test-ncbi-key');
    });

    it('should handle EFetch API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      });

      const response = await fetch_pubmed_details({ pmid: samplePmid });
      expect(response.result.success).toBe(false);
      expect(response.result.error).toContain(
        `EFetch failed for PMID ${samplePmid}: 500 Server Error`
      );
      expect(mockParseStringPromise).not.toHaveBeenCalled();
    });

    it('should handle XML parsing error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '<bad_xml />' });
      mockParseStringPromise.mockRejectedValueOnce(new Error('XML parsing failed'));

      const response = await fetch_pubmed_details({ pmid: samplePmid });
      expect(response.result.success).toBe(false);
      expect(response.result.error).toContain('Error fetching/parsing details for PMID');
      expect(response.result.error).toContain('XML parsing failed');
    });

    it('should handle case where article data is not found in parsed XML', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '<empty_xml />' });
      mockParseStringPromise.mockResolvedValueOnce({ PubmedArticleSet: {} }); // No PubmedArticle or MedlineCitation

      const response = await fetch_pubmed_details({ pmid: samplePmid });
      expect(response.result.success).toBe(false);
      expect(response.result.error).toContain(
        `Could not find article data in EFetch response for PMID ${samplePmid}`
      );
    });

    it('should extract abstract correctly when AbstractText is a string', async () => {
      const xmlResponse = mockValidXmlResponse(samplePmid);
      // Modify AbstractText to be a direct string
      xmlResponse.PubmedArticleSet.PubmedArticle.MedlineCitation.Article.Abstract.AbstractText =
        'Direct string abstract.';
      mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '<xml />' });
      mockParseStringPromise.mockResolvedValueOnce(xmlResponse);

      const response = await fetch_pubmed_details({ pmid: samplePmid });
      expect(response.result.abstract).toBe('Direct string abstract.');
    });

    it('should extract abstract correctly when AbstractText is an object with _ property', async () => {
      const xmlResponse = mockValidXmlResponse(samplePmid);
      // Modify AbstractText to be an object with _
      xmlResponse.PubmedArticleSet.PubmedArticle.MedlineCitation.Article.Abstract.AbstractText = {
        _: 'Object with underscore abstract.',
      };
      mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '<xml />' });
      mockParseStringPromise.mockResolvedValueOnce(xmlResponse);

      const response = await fetch_pubmed_details({ pmid: samplePmid });
      expect(response.result.abstract).toBe('Object with underscore abstract.');
    });

    it('should extract abstract correctly when AbstractText is an array of strings/objects', async () => {
      const xmlResponse = mockValidXmlResponse(samplePmid);
      // Modify AbstractText to be an array
      xmlResponse.PubmedArticleSet.PubmedArticle.MedlineCitation.Article.Abstract.AbstractText = [
        'First part.',
        { _: 'Second part.' },
        'Third part.',
      ];
      mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '<xml />' });
      mockParseStringPromise.mockResolvedValueOnce(xmlResponse);

      const response = await fetch_pubmed_details({ pmid: samplePmid });
      expect(response.result.abstract).toBe('First part.\nSecond part.\nThird part.');
    });

    it('should return default text if AbstractText is missing or empty', async () => {
      const xmlResponse = mockValidXmlResponse(samplePmid);
      delete xmlResponse.PubmedArticleSet.PubmedArticle.MedlineCitation.Article.Abstract; // Remove Abstract section
      mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '<xml />' });
      mockParseStringPromise.mockResolvedValueOnce(xmlResponse);
      const response1 = await fetch_pubmed_details({ pmid: samplePmid });
      expect(response1.result.abstract).toBe('Abstract not available.');

      xmlResponse.PubmedArticleSet.PubmedArticle.MedlineCitation.Article.Abstract = {
        AbstractText: null,
      }; // Empty AbstractText
      mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '<xml />' });
      mockParseStringPromise.mockResolvedValueOnce(xmlResponse);
      const response2 = await fetch_pubmed_details({ pmid: samplePmid });
      expect(response2.result.abstract).toBe('Abstract not available.');
    });

    it('should handle various structures for ArticleIdList (single object vs array)', async () => {
      const pmcId = 'PMC67890';
      // Case 1: ArticleId is an array (already handled by mockValidXmlResponse)
      mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '<xml_array />' });
      mockParseStringPromise.mockResolvedValueOnce(mockValidXmlResponse(samplePmid, pmcId));
      let response = await fetch_pubmed_details({ pmid: samplePmid });
      expect(response.result.pmc_url).toContain(pmcId);

      // Case 2: ArticleId is a single object (not an array)
      const singleIdXmlResponse = mockValidXmlResponse(samplePmid, pmcId);
      // @ts-ignore // Forcing single object structure for test
      singleIdXmlResponse.PubmedArticleSet.PubmedArticle.PubmedData.ArticleIdList.ArticleId = {
        $: { IdType: 'pmc' },
        _: pmcId,
      };
      mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '<xml_single />' });
      mockParseStringPromise.mockResolvedValueOnce(singleIdXmlResponse);
      response = await fetch_pubmed_details({ pmid: samplePmid });
      expect(response.result.pmc_url).toContain(pmcId);
    });
  });

  describe('fetchPubmedDetailsDeclaration', () => {
    it('should have correct name and description', () => {
      expect(fetchPubmedDetailsDeclaration.name).toBe('fetch_pubmed_details');
      expect(fetchPubmedDetailsDeclaration.description).toBeDefined();
    });

    it('should have pmid as a required parameter of type STRING', () => {
      const props = fetchPubmedDetailsDeclaration.parameters.properties;
      expect(props.pmid.type).toBe('STRING');
      expect(fetchPubmedDetailsDeclaration.parameters.required).toEqual(['pmid']);
    });
  });
});
