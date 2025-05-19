import { jest } from '@jest/globals';

// Mock node-fetch
// We need to mock the default export from node-fetch
const mockFetch = jest.fn();
jest.mock('node-fetch', () => ({
  __esModule: true, // This is important for ES modules
  default: mockFetch,
}));

// Import the functions to be tested
import { search_pubmed, searchPubmedDeclaration } from '../../tools/searchPubmed.js';

// Store original process.env
const originalEnv = { ...process.env };

describe('searchPubmed Tool', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    process.env = { ...originalEnv }; // Restore original env
    // Clear NCBI_API_KEY by default for tests, set it specifically when needed
    delete process.env.NCBI_API_KEY;
  });

  afterAll(() => {
    process.env = originalEnv; // Ensure original env is restored after all tests
  });

  const mockESearchBaseResponse = (idlist = ['123', '456']) => ({
    esearchresult: {
      count: idlist.length.toString(),
      retmax: idlist.length.toString(),
      retstart: '0',
      idlist: idlist,
    },
  });

  const mockESummaryBaseResponse = (pmids = ['123', '456']) => {
    const result = { uids: pmids };
    pmids.forEach((pmid) => {
      result[pmid] = {
        uid: pmid,
        pubdate: '2023 Jan 01',
        epubdate: '',
        source: 'Test Journal',
        authors: [{ name: 'Author A' }, { name: 'Author B' }],
        lastauthor: 'Author B',
        title: `Title for ${pmid}`,
        sorttitle: `title for ${pmid}`,
        volume: '10',
        issue: '1',
        pages: '1-10',
        lang: ['eng'],
        issn: '',
        essn: '',
        pubtype: ['Journal Article'],
        articleids: [{ idtype: 'pubmed', idtypen: 1, value: pmid }],
        history: [],
        references: [],
        attributes: [],
        pmcrefcount: '',
        fulljournalname: 'Test Journal of Science',
        elocationid: '',
        doctype: 'citation',
        srccontriblist: [],
        booktitle: '',
        medium: '',
        edition: '',
        publisherlocation: '',
        publishername: '',
        srcdate: '',
        reportnumber: '',
        availablefromurl: '',
        locationlabel: '',
        doccontriblist: [],
        docdate: '',
        bookname: '',
        chapter: '',
        sortpubdate: '2023/01/01 00:00',
        sortfirstauthor: 'Author A',
        vernaculartitle: '',
      };
    });
    return { header: { type: 'esummary', version: '0.3' }, result };
  };

  describe('search_pubmed function', () => {
    it('should make successful ESearch and ESummary calls with default parameters', async () => {
      const pmids = ['3000001', '3000002'];
      mockFetch
        .mockResolvedValueOnce({
          // ESearch response
          ok: true,
          json: async () => mockESearchBaseResponse(pmids),
        })
        .mockResolvedValueOnce({
          // ESummary response
          ok: true,
          json: async () => mockESummaryBaseResponse(pmids),
        });

      const args = { query: 'cancer research' };
      const response = await search_pubmed(args);

      expect(mockFetch).toHaveBeenCalledTimes(2);

      // ESearch call assertions
      const esearchCall = mockFetch.mock.calls[0];
      expect(esearchCall[0]).toContain('esearch.fcgi');
      expect(esearchCall[0]).toContain('db=pubmed');
      expect(esearchCall[0]).toContain('term=cancer%20research');
      expect(esearchCall[0]).toContain('retmax=5'); // Default max_results
      expect(esearchCall[0]).toContain('sort=relevance');

      // ESummary call assertions
      const esummaryCall = mockFetch.mock.calls[1];
      expect(esummaryCall[0]).toContain('esummary.fcgi');
      expect(esummaryCall[0]).toContain('db=pubmed');
      expect(esummaryCall[0]).toContain(`id=${pmids.join('%2C')}`);

      expect(response.result.success).toBe(true);
      expect(response.result.results).toHaveLength(pmids.length);
      response.result.results.forEach((res, index) => {
        expect(res.pmid).toBe(pmids[index]);
        expect(res.title).toBe(`Title for ${pmids[index]}`);
        expect(res.abstract).toContain(
          `Summary only. Use 'fetch_pubmed_details' with PMID ${pmids[index]}`
        );
        expect(res.url).toBe(`https://pubmed.ncbi.nlm.nih.gov/${pmids[index]}/`);
      });
    });

    it('should include NCBI_API_KEY if available', async () => {
      process.env.NCBI_API_KEY = 'test-ncbi-key';
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockESearchBaseResponse() })
        .mockResolvedValueOnce({ ok: true, json: async () => mockESummaryBaseResponse() });

      await search_pubmed({ query: 'test' });

      expect(mockFetch.mock.calls[0][0]).toContain('api_key=test-ncbi-key');
      expect(mockFetch.mock.calls[1][0]).toContain('api_key=test-ncbi-key');
    });

    it('should apply article_type filter to ESearch term', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockESearchBaseResponse() })
        .mockResolvedValueOnce({ ok: true, json: async () => mockESummaryBaseResponse() });

      const articleType = 'Clinical Trial';
      await search_pubmed({ query: 'flu vaccine', article_type: articleType });

      const expectedTerm = `flu%20vaccine%20AND%20%22${encodeURIComponent(articleType)}%22%5Bptyp%5D`;
      expect(mockFetch.mock.calls[0][0]).toContain(`term=${expectedTerm}`);
    });

    it('should not add [ptyp] filter if article_type is already in query', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockESearchBaseResponse() })
        .mockResolvedValueOnce({ ok: true, json: async () => mockESummaryBaseResponse() });

      const articleType = 'Review';
      // Query already contains "Review [ptyp]" (case insensitive check in actual code)
      await search_pubmed({ query: 'covid treatment Review [ptyp]', article_type: articleType });

      // We expect the original query term to be used directly, without appending the filter again
      const esearchCallUrl = mockFetch.mock.calls[0][0];
      expect(esearchCallUrl).toContain(`term=covid%20treatment%20Review%20%5Bptyp%5D`);
      // Ensure it wasn't added again (double check)
      expect(esearchCallUrl.match(/Review%22%5Bptyp%5D/g)?.length || 0).toBe(0); // Should not find the encoded version
      expect(esearchCallUrl.match(/Review%20%5Bptyp%5D/g)?.length || 0).toBe(1); // Should find the original one
    });

    it('should apply pmc_open_access_only filter to ESearch term', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockESearchBaseResponse() })
        .mockResolvedValueOnce({ ok: true, json: async () => mockESummaryBaseResponse() });

      await search_pubmed({ query: 'genetics', pmc_open_access_only: true });

      const expectedTermPart = `%28genetics%29%20AND%20pubmed%20pmc%20open%20access%5Bfilter%5D`;
      expect(mockFetch.mock.calls[0][0]).toContain(expectedTermPart);
    });

    it('should correctly use sort_order for publication_date', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockESearchBaseResponse() })
        .mockResolvedValueOnce({ ok: true, json: async () => mockESummaryBaseResponse() });

      await search_pubmed({ query: 'aging', sort_order: 'publication_date' });
      expect(mockFetch.mock.calls[0][0]).toContain('sort=pub%2Bdate');
    });

    it('should apply min_publication_date and max_publication_date filters', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockESearchBaseResponse() })
        .mockResolvedValueOnce({ ok: true, json: async () => mockESummaryBaseResponse() });

      const minDate = '2022/01/01';
      const maxDate = '2023/12/31';
      await search_pubmed({
        query: 'diabetes',
        min_publication_date: minDate,
        max_publication_date: maxDate,
      });

      const esearchCallUrl = mockFetch.mock.calls[0][0];
      expect(esearchCallUrl).toContain(`mindate=${encodeURIComponent(minDate)}`);
      expect(esearchCallUrl).toContain(`maxdate=${encodeURIComponent(maxDate)}`);
      expect(esearchCallUrl).toContain('datetype=pdat');
    });

    it('should sanitize max_results (1-15 range, default 5)', async () => {
      mockFetch
        .mockResolvedValue({ ok: true, json: async () => mockESearchBaseResponse([]) }) // no PMIDs needed for this
        .mockResolvedValue({ ok: true, json: async () => mockESummaryBaseResponse([]) });

      // Test case 1: max_results too low
      await search_pubmed({ query: 'test', max_results: 0 });
      expect(mockFetch.mock.calls[0][0]).toContain('retmax=1');
      mockFetch.mockClear();

      // Test case 2: max_results too high
      await search_pubmed({ query: 'test', max_results: 20 });
      expect(mockFetch.mock.calls[0][0]).toContain('retmax=15');
      mockFetch.mockClear();

      // Test case 3: max_results not a number
      await search_pubmed({ query: 'test', max_results: 'abc' });
      expect(mockFetch.mock.calls[0][0]).toContain('retmax=5'); // Defaults to 5
      mockFetch.mockClear();

      // Test case 4: max_results within range
      await search_pubmed({ query: 'test', max_results: 10 });
      expect(mockFetch.mock.calls[0][0]).toContain('retmax=10');
    });

    it('should return empty results if ESearch finds no PMIDs', async () => {
      mockFetch.mockResolvedValueOnce({
        // ESearch response with no PMIDs
        ok: true,
        json: async () => mockESearchBaseResponse([]), // Empty idlist
      });

      const response = await search_pubmed({ query: 'very_obscure_topic_xyz' });
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only ESearch should be called
      expect(response.result.success).toBe(true);
      expect(response.result.results).toEqual([]);
    });

    it('should handle ESearch API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const response = await search_pubmed({ query: 'test' });
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(response.result.success).toBe(false);
      expect(response.result.error).toBe(
        'Error during PubMed search: ESearch failed: 500 Internal Server Error'
      );
    });

    it('should handle ESummary API error', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockESearchBaseResponse(['789']) }) // Successful ESearch
        .mockResolvedValueOnce({
          // Failed ESummary
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
        });

      const response = await search_pubmed({ query: 'test' });
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(response.result.success).toBe(false);
      expect(response.result.error).toBe(
        'Error during PubMed search: ESummary failed: 503 Service Unavailable'
      );
    });

    it('should handle unexpected ESummary result structure (no summaryResult.result)', async () => {
      const pmids = ['111'];
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockESearchBaseResponse(pmids) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ header: {}, result: null }) }); // No 'result' object with PMIDs

      const response = await search_pubmed({ query: 'test_bad_esummary_structure' });
      expect(response.result.success).toBe(true); // Still considered success, but with no results
      expect(response.result.results).toEqual([]);
    });

    it('should handle ESummary result where a PMID key is missing in summaryResult.result', async () => {
      const pmidsFromESearch = ['222', '333']; // ESearch finds two
      const summaryData = mockESummaryBaseResponse(['222']); // ESummary only returns data for '222'

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockESearchBaseResponse(pmidsFromESearch),
        })
        .mockResolvedValueOnce({ ok: true, json: async () => summaryData });

      const response = await search_pubmed({ query: 'test_missing_pmid_summary' });
      expect(response.result.success).toBe(true);
      expect(response.result.results).toHaveLength(1); // Only one result processed
      expect(response.result.results[0].pmid).toBe('222');
    });

    it('should handle network error during fetch', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));
      const response = await search_pubmed({ query: 'test' });
      expect(response.result.success).toBe(false);
      expect(response.result.error).toBe('Error during PubMed search: Network Error');
    });
  });

  describe('searchPubmedDeclaration', () => {
    // Basic checks for the declaration
    it('should have correct name and description', () => {
      expect(searchPubmedDeclaration.name).toBe('search_pubmed');
      expect(searchPubmedDeclaration.description).toBeDefined();
    });

    it('should have query as a required parameter of type STRING', () => {
      const props = searchPubmedDeclaration.parameters.properties;
      expect(props.query.type).toBe('STRING'); // Assuming Type.STRING resolves to this
      expect(searchPubmedDeclaration.parameters.required).toContain('query');
    });

    it('should define optional parameters like max_results, article_type, sort_order, dates, and pmc_open_access_only', () => {
      const props = searchPubmedDeclaration.parameters.properties;
      expect(props.max_results.type).toBe('INTEGER');
      expect(props.article_type.type).toBe('STRING');
      expect(props.article_type.enum).toBeInstanceOf(Array);
      expect(props.sort_order.type).toBe('STRING');
      expect(props.sort_order.enum).toEqual(['relevance', 'publication_date']);
      expect(props.min_publication_date.type).toBe('STRING');
      expect(props.max_publication_date.type).toBe('STRING');
      expect(props.pmc_open_access_only.type).toBe('BOOLEAN'); // Assuming Type.BOOLEAN
    });
  });
});
